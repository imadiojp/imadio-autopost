import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import db from '../models/database'

/**
 * Get user settings
 */
export async function getSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!

    const settings = db
      .prepare('SELECT * FROM settings WHERE user_id = ?')
      .get(userId) as any

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' })
    }

    res.json({
      success: true,
      settings: {
        timezone: settings.timezone,
        bulkPause: Boolean(settings.bulk_pause),
        emailNotifications: Boolean(settings.email_notifications),
        email: settings.email,
        autoRetry: Boolean(settings.auto_retry),
        maxRetryCount: settings.max_retry_count,
        retryInterval: settings.retry_interval,
      },
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
}

/**
 * Update user settings
 */
export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const {
      timezone,
      bulkPause,
      emailNotifications,
      email,
      autoRetry,
      maxRetryCount,
      retryInterval,
    } = req.body

    const updates: string[] = []
    const params: any[] = []

    if (timezone !== undefined) {
      updates.push('timezone = ?')
      params.push(timezone)
    }
    if (bulkPause !== undefined) {
      updates.push('bulk_pause = ?')
      params.push(bulkPause ? 1 : 0)
    }
    if (emailNotifications !== undefined) {
      updates.push('email_notifications = ?')
      params.push(emailNotifications ? 1 : 0)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email)
    }
    if (autoRetry !== undefined) {
      updates.push('auto_retry = ?')
      params.push(autoRetry ? 1 : 0)
    }
    if (maxRetryCount !== undefined) {
      updates.push('max_retry_count = ?')
      params.push(maxRetryCount)
    }
    if (retryInterval !== undefined) {
      updates.push('retry_interval = ?')
      params.push(retryInterval)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    params.push(userId)

    db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`).run(
      ...params
    )

    res.json({
      success: true,
      message: 'Settings updated successfully',
    })
  } catch (error: any) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
}
