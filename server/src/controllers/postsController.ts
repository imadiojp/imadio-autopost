import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import db from '../models/database'

/**
 * Create a new post
 */
export async function createPost(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const {
      id,
      text,
      images,
      scheduledDate,
      scheduledTime,
      timezone,
      accountIds,
      type,
      threadCount,
    } = req.body

    if (!text || !scheduledDate || !scheduledTime || !accountIds || accountIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Verify that all accounts belong to the user
    const accountCheck = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM x_accounts
      WHERE user_id = ? AND id IN (${accountIds.map(() => '?').join(',')})
    `
      )
      .get(userId, ...accountIds) as any

    if (accountCheck.count !== accountIds.length) {
      return res.status(403).json({ error: 'One or more accounts do not belong to you' })
    }

    // Get settings for max retry count
    const settings = db
      .prepare('SELECT max_retry_count FROM settings WHERE user_id = ?')
      .get(userId) as any

    const maxRetryCount = settings?.max_retry_count || 3

    // Create post
    db.prepare(
      `
      INSERT INTO posts (
        id, user_id, text, scheduled_date, scheduled_time,
        timezone, status, post_type, thread_count, max_retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
    `
    ).run(
      id,
      userId,
      text,
      scheduledDate,
      scheduledTime,
      timezone,
      type || 'single',
      threadCount || 1,
      maxRetryCount
    )

    // Create post-account associations
    const insertPostAccount = db.prepare(
      'INSERT INTO post_accounts (post_id, account_id) VALUES (?, ?)'
    )

    for (const accountId of accountIds) {
      insertPostAccount.run(id, accountId)
    }

    // Create image associations if any
    if (images && images.length > 0) {
      const insertImage = db.prepare(
        'INSERT INTO post_images (id, post_id, url, file_path) VALUES (?, ?, ?, ?)'
      )

      for (const image of images) {
        insertImage.run(image.id, id, image.url, image.filePath || null)
      }
    }

    res.status(201).json({
      success: true,
      post: {
        id,
        text,
        scheduledDate,
        scheduledTime,
        timezone,
        status: 'scheduled',
        type: type || 'single',
        threadCount: threadCount || 1,
      },
    })
  } catch (error: any) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
}

/**
 * Get all posts for the current user
 */
export async function getPosts(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { status, type } = req.query

    let query = 'SELECT * FROM posts WHERE user_id = ?'
    const params: any[] = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (type) {
      query += ' AND post_type = ?'
      params.push(type)
    }

    query += ' ORDER BY scheduled_date DESC, scheduled_time DESC'

    const posts = db.prepare(query).all(...params) as any[]

    // Get images and accounts for each post
    const postsWithDetails = posts.map((post) => {
      const images = db
        .prepare('SELECT id, url, file_path FROM post_images WHERE post_id = ?')
        .all(post.id)

      const accounts = db
        .prepare(
          `
        SELECT pa.account_id, pa.posted, pa.posted_tweet_id,
               pa.posted_at, pa.error_message
        FROM post_accounts pa
        WHERE pa.post_id = ?
      `
        )
        .all(post.id)

      return {
        id: post.id,
        text: post.text,
        images,
        scheduledDate: post.scheduled_date,
        scheduledTime: post.scheduled_time,
        timezone: post.timezone,
        accountIds: accounts.map((a: any) => a.account_id),
        status: post.status,
        type: post.post_type,
        threadCount: post.thread_count,
        retryCount: post.retry_count,
        maxRetryCount: post.max_retry_count,
        errorMessage: post.error_message,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        postedAt: post.posted_at,
        accountDetails: accounts,
      }
    })

    res.json({
      success: true,
      posts: postsWithDetails,
    })
  } catch (error: any) {
    console.error('Get posts error:', error)
    res.status(500).json({ error: 'Failed to get posts' })
  }
}

/**
 * Get a single post by ID
 */
export async function getPost(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { postId } = req.params

    const post = db
      .prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?')
      .get(postId, userId) as any

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const images = db
      .prepare('SELECT id, url, file_path FROM post_images WHERE post_id = ?')
      .all(postId)

    const accounts = db
      .prepare(
        `
      SELECT pa.account_id, pa.posted, pa.posted_tweet_id,
             pa.posted_at, pa.error_message
      FROM post_accounts pa
      WHERE pa.post_id = ?
    `
      )
      .all(postId)

    res.json({
      success: true,
      post: {
        id: post.id,
        text: post.text,
        images,
        scheduledDate: post.scheduled_date,
        scheduledTime: post.scheduled_time,
        timezone: post.timezone,
        accountIds: accounts.map((a: any) => a.account_id),
        status: post.status,
        type: post.post_type,
        threadCount: post.thread_count,
        retryCount: post.retry_count,
        maxRetryCount: post.max_retry_count,
        errorMessage: post.error_message,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        postedAt: post.posted_at,
        accountDetails: accounts,
      },
    })
  } catch (error: any) {
    console.error('Get post error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
}

/**
 * Update a post
 */
export async function updatePost(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { postId } = req.params
    const {
      text,
      images,
      scheduledDate,
      scheduledTime,
      timezone,
      accountIds,
      type,
      threadCount,
    } = req.body

    // Verify post belongs to user
    const post = db
      .prepare('SELECT id, status FROM posts WHERE id = ? AND user_id = ?')
      .get(postId, userId) as any

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Only allow updating scheduled posts
    if (post.status !== 'scheduled') {
      return res.status(400).json({ error: 'Can only edit scheduled posts' })
    }

    // Update post
    const updates: string[] = []
    const params: any[] = []

    if (text !== undefined) {
      updates.push('text = ?')
      params.push(text)
    }
    if (scheduledDate !== undefined) {
      updates.push('scheduled_date = ?')
      params.push(scheduledDate)
    }
    if (scheduledTime !== undefined) {
      updates.push('scheduled_time = ?')
      params.push(scheduledTime)
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?')
      params.push(timezone)
    }
    if (type !== undefined) {
      updates.push('post_type = ?')
      params.push(type)
    }
    if (threadCount !== undefined) {
      updates.push('thread_count = ?')
      params.push(threadCount)
    }

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(postId)

    if (updates.length > 0) {
      db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(
        ...params
      )
    }

    // Update account associations if provided
    if (accountIds && accountIds.length > 0) {
      // Verify accounts belong to user
      const accountCheck = db
        .prepare(
          `
        SELECT COUNT(*) as count
        FROM x_accounts
        WHERE user_id = ? AND id IN (${accountIds.map(() => '?').join(',')})
      `
        )
        .get(userId, ...accountIds) as any

      if (accountCheck.count !== accountIds.length) {
        return res.status(403).json({ error: 'One or more accounts do not belong to you' })
      }

      // Delete old associations
      db.prepare('DELETE FROM post_accounts WHERE post_id = ?').run(postId)

      // Create new associations
      const insertPostAccount = db.prepare(
        'INSERT INTO post_accounts (post_id, account_id) VALUES (?, ?)'
      )

      for (const accountId of accountIds) {
        insertPostAccount.run(postId, accountId)
      }
    }

    // Update images if provided
    if (images !== undefined) {
      // Delete old images
      db.prepare('DELETE FROM post_images WHERE post_id = ?').run(postId)

      // Insert new images
      if (images.length > 0) {
        const insertImage = db.prepare(
          'INSERT INTO post_images (id, post_id, url, file_path) VALUES (?, ?, ?, ?)'
        )

        for (const image of images) {
          insertImage.run(image.id, postId, image.url, image.filePath || null)
        }
      }
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
    })
  } catch (error: any) {
    console.error('Update post error:', error)
    res.status(500).json({ error: 'Failed to update post' })
  }
}

/**
 * Delete a post
 */
export async function deletePost(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { postId } = req.params

    const result = db
      .prepare('DELETE FROM posts WHERE id = ? AND user_id = ?')
      .run(postId, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    res.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete post error:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
}
