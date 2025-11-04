import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../models/database'
import { generateToken } from '../middleware/auth'

/**
 * Register a new user
 */
export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    // Check if user already exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email)

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = db
      .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
      .run(username, email, passwordHash)

    const userId = result.lastInsertRowid as number

    // Create default settings for user
    db.prepare(
      `
      INSERT INTO settings (user_id)
      VALUES (?)
    `
    ).run(userId)

    // Generate JWT token
    const token = generateToken(userId)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
      },
    })
  } catch (error: any) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as any

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = generateToken(user.id)

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req: any, res: Response) {
  try {
    const userId = req.userId

    const user = db
      .prepare('SELECT id, email, created_at FROM users WHERE id = ?')
      .get(userId) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
}
