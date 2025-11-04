import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import db from '../models/database'
import {
  getAuthUrl,
  exchangeCodeForToken,
  getXUserInfo,
  getAccountType,
} from '../services/xApiService'
import { config } from '../config'
import crypto from 'crypto'

// Temporary storage for OAuth state and code verifiers
// In production, use Redis or a database
const oauthSessions: Map<
  string,
  {
    userId: number
    codeVerifier: string
    createdAt: number
  }
> = new Map()

// Clean up old sessions every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [state, session] of oauthSessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      oauthSessions.delete(state)
    }
  }
}, 60 * 60 * 1000)

/**
 * Initiate X OAuth flow (anonymous)
 */
export async function initiateXAuthAnonymous(req: any, res: Response) {
  try {
    const { anonymousId } = req.body

    if (!anonymousId) {
      return res.status(400).json({ error: 'Anonymous ID is required' })
    }

    // Check if anonymous user exists, if not create one
    let user: any = db.prepare('SELECT id FROM users WHERE anonymous_id = ?').get(anonymousId)

    if (!user) {
      // Create anonymous user
      const result = db.prepare('INSERT INTO users (anonymous_id) VALUES (?)').run(anonymousId)
      const userId = result.lastInsertRowid as number

      // Create default settings
      db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId)

      user = { id: userId }
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    // Get authorization URL with code verifier
    const { url: authUrl, codeVerifier } = getAuthUrl(state)

    // Store session in database
    try {
      db.prepare(
        'INSERT OR REPLACE INTO oauth_sessions (state, user_id, code_verifier) VALUES (?, ?, ?)'
      ).run(state, user.id, codeVerifier)
      console.log(`✓ Stored OAuth session: state=${state}, userId=${user.id}`)
    } catch (error) {
      console.error('✗ Failed to store OAuth session:', error)
      throw error
    }

    res.json({
      success: true,
      authUrl,
      state,
      codeVerifier,
    })
  } catch (error: any) {
    console.error('Initiate X auth error:', error)
    res.status(500).json({ error: 'Failed to initiate X authentication' })
  }
}

/**
 * Initiate X OAuth flow
 */
export async function initiateXAuth(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('base64url')

    // Store session
    oauthSessions.set(state, {
      userId,
      codeVerifier,
      createdAt: Date.now(),
    })

    // Get authorization URL
    const authUrl = getAuthUrl(state)

    res.json({
      success: true,
      authUrl,
      state,
    })
  } catch (error: any) {
    console.error('Initiate X auth error:', error)
    res.status(500).json({ error: 'Failed to initiate X authentication' })
  }
}

/**
 * Handle OAuth callback from X
 */
export async function handleXCallback(req: AuthRequest, res: Response) {
  try {
    const { code, state, code_verifier } = req.query

    if (!code || !state) {
      return res.redirect(
        `${config.frontendUrl}/connections?error=missing_params`
      )
    }

    // Get session from database
    console.log(`Looking for OAuth session with state=${state}`)
    const session: any = db
      .prepare('SELECT user_id, code_verifier FROM oauth_sessions WHERE state = ?')
      .get(state as string)

    if (!session) {
      console.error(`✗ OAuth session not found for state=${state}`)
      return res.redirect(`${config.frontendUrl}/connections?error=invalid_state`)
    }

    const { user_id: userId, code_verifier: codeVerifier } = session
    console.log(`✓ Found OAuth session: userId=${userId}`)

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      code as string,
      codeVerifier
    )

    // Get user info from X
    const xUserInfo = await getXUserInfo(tokenData.accessToken)

    // Determine account type
    const accountType = await getAccountType(tokenData.accessToken)

    // Calculate token expiry
    let tokenExpiresAt: string | null = null
    if (tokenData.expiresIn) {
      const expiryDate = new Date(Date.now() + tokenData.expiresIn * 1000)
      tokenExpiresAt = expiryDate.toISOString()
    }

    // Check if account already exists
    const existingAccount = db
      .prepare('SELECT id FROM x_accounts WHERE id = ? AND user_id = ?')
      .get(xUserInfo.id, userId)

    if (existingAccount) {
      // Update existing account
      db.prepare(
        `
        UPDATE x_accounts
        SET access_token = ?,
            refresh_token = ?,
            token_expires_at = ?,
            is_connected = 1,
            display_name = ?,
            username = ?,
            avatar = ?,
            updated_at = ?
        WHERE id = ? AND user_id = ?
      `
      ).run(
        tokenData.accessToken,
        tokenData.refreshToken || null,
        tokenExpiresAt,
        xUserInfo.displayName,
        xUserInfo.username,
        xUserInfo.avatar || null,
        new Date().toISOString(),
        xUserInfo.id,
        userId
      )
    } else {
      // Create new account
      db.prepare(
        `
        INSERT INTO x_accounts (
          id, user_id, display_name, username, account_type,
          access_token, refresh_token, token_expires_at,
          is_connected, avatar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `
      ).run(
        xUserInfo.id,
        userId,
        xUserInfo.displayName,
        xUserInfo.username,
        accountType,
        tokenData.accessToken,
        tokenData.refreshToken || null,
        tokenExpiresAt,
        xUserInfo.avatar || null
      )
    }

    // Clean up session from database
    db.prepare('DELETE FROM oauth_sessions WHERE state = ?').run(state as string)

    // Redirect to frontend with success
    res.redirect(`${config.frontendUrl}/connections?success=true`)
  } catch (error: any) {
    console.error('X callback error:', error)
    res.redirect(
      `${config.frontendUrl}/connections?error=${encodeURIComponent(error.message)}`
    )
  }
}

/**
 * Get all X accounts for the current user
 */
export async function getXAccounts(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!

    const accounts = db
      .prepare(
        `
      SELECT id, display_name, username, account_type,
             is_connected, avatar, created_at, updated_at
      FROM x_accounts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(userId) as any[]

    res.json({
      success: true,
      accounts: accounts.map((acc) => ({
        id: acc.id,
        displayName: acc.display_name,
        username: acc.username,
        accountType: acc.account_type,
        isConnected: Boolean(acc.is_connected),
        avatar: acc.avatar,
        createdAt: acc.created_at,
        updatedAt: acc.updated_at,
      })),
    })
  } catch (error: any) {
    console.error('Get X accounts error:', error)
    res.status(500).json({ error: 'Failed to get X accounts' })
  }
}

/**
 * Get all X accounts for anonymous user
 */
export async function getXAccountsAnonymous(req: any, res: Response) {
  try {
    const { anonymousId } = req.body

    if (!anonymousId) {
      return res.status(400).json({ error: 'Anonymous ID is required' })
    }

    // Get user by anonymous ID
    const user: any = db.prepare('SELECT id FROM users WHERE anonymous_id = ?').get(anonymousId)

    if (!user) {
      return res.json({ success: true, accounts: [] })
    }

    const accounts = db
      .prepare(
        `
      SELECT id, display_name, username, account_type,
             is_connected, avatar, created_at, updated_at
      FROM x_accounts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(user.id) as any[]

    res.json({
      success: true,
      accounts: accounts.map((acc) => ({
        id: acc.id,
        displayName: acc.display_name,
        username: acc.username,
        accountType: acc.account_type,
        isConnected: Boolean(acc.is_connected),
        avatar: acc.avatar,
        createdAt: acc.created_at,
        updatedAt: acc.updated_at,
      })),
    })
  } catch (error: any) {
    console.error('Get X accounts (anonymous) error:', error)
    res.status(500).json({ error: 'Failed to get X accounts' })
  }
}

/**
 * Disconnect an X account
 */
export async function disconnectXAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { accountId } = req.params

    const result = db
      .prepare(
        `
      UPDATE x_accounts
      SET is_connected = 0, updated_at = ?
      WHERE id = ? AND user_id = ?
    `
      )
      .run(new Date().toISOString(), accountId, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    res.json({
      success: true,
      message: 'Account disconnected successfully',
    })
  } catch (error: any) {
    console.error('Disconnect X account error:', error)
    res.status(500).json({ error: 'Failed to disconnect account' })
  }
}

/**
 * Delete an X account
 */
export async function deleteXAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { accountId } = req.params

    const result = db
      .prepare('DELETE FROM x_accounts WHERE id = ? AND user_id = ?')
      .run(accountId, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete X account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
}

/**
 * Update account type (free/premium)
 */
export async function updateAccountType(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { accountId } = req.params
    const { accountType } = req.body

    if (!['free', 'premium'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' })
    }

    const result = db
      .prepare(
        `
      UPDATE x_accounts
      SET account_type = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `
      )
      .run(accountType, new Date().toISOString(), accountId, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    res.json({
      success: true,
      message: 'Account type updated successfully',
    })
  } catch (error: any) {
    console.error('Update account type error:', error)
    res.status(500).json({ error: 'Failed to update account type' })
  }
}
