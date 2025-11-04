import cron from 'node-cron'
import db from '../models/database'
import { postTweet, postThread, createXClient } from './xApiService'

interface ScheduledPost {
  id: string
  userId: number
  text: string
  scheduledDate: string
  scheduledTime: string
  timezone: string
  status: string
  postType: 'single' | 'thread'
  threadCount: number
  retryCount: number
  maxRetryCount: number
}

interface PostAccount {
  postId: string
  accountId: string
  accessToken: string
  posted: number
}

interface PostImage {
  id: string
  postId: string
  url: string
  filePath: string | null
}

let schedulerRunning = false

/**
 * Start the scheduler that checks for posts to publish every minute
 */
export function startScheduler() {
  if (schedulerRunning) {
    console.log('Scheduler already running')
    return
  }

  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Checking for scheduled posts...')
    await processScheduledPosts()
  })

  schedulerRunning = true
  console.log('Scheduler started - checking for posts every minute')
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  schedulerRunning = false
  console.log('Scheduler stopped')
}

/**
 * Process all scheduled posts that are due to be posted
 */
async function processScheduledPosts() {
  try {
    // Check for bulk pause setting
    const bulkPauseSettings = db
      .prepare(
        `SELECT bulk_pause FROM settings WHERE bulk_pause = 1 LIMIT 1`
      )
      .all()

    if (bulkPauseSettings.length > 0) {
      console.log('Bulk pause is enabled - skipping scheduled posts')
      return
    }

    // Get current time
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Find posts that are due (scheduled for current date and time or earlier)
    const duePosts = db
      .prepare(
        `
      SELECT * FROM posts
      WHERE status = 'scheduled'
      AND (
        scheduled_date < ?
        OR (scheduled_date = ? AND scheduled_time <= ?)
      )
      ORDER BY scheduled_date ASC, scheduled_time ASC
      LIMIT 100
    `
      )
      .all(currentDate, currentDate, currentTime) as ScheduledPost[]

    console.log(`Found ${duePosts.length} posts to process`)

    for (const post of duePosts) {
      await processPost(post)
    }
  } catch (error) {
    console.error('Error processing scheduled posts:', error)
  }
}

/**
 * Process a single post - publish it to all selected accounts
 */
async function processPost(post: ScheduledPost) {
  try {
    console.log(`Processing post ${post.id}`)

    // Update status to 'posting'
    db.prepare('UPDATE posts SET status = ?, updated_at = ? WHERE id = ?').run(
      'posting',
      new Date().toISOString(),
      post.id
    )

    // Get accounts for this post
    const postAccounts = db
      .prepare(
        `
      SELECT pa.*, xa.access_token
      FROM post_accounts pa
      JOIN x_accounts xa ON pa.account_id = xa.id
      WHERE pa.post_id = ? AND pa.posted = 0
    `
      )
      .all(post.id) as PostAccount[]

    if (postAccounts.length === 0) {
      throw new Error('No accounts found for this post')
    }

    // Get images for this post
    const images = db
      .prepare('SELECT * FROM post_images WHERE post_id = ?')
      .all(post.id) as PostImage[]

    // Split text into threads if needed
    const texts = post.text.split('\n\n').filter((t) => t.trim())

    let allSuccess = true
    let errorMessage = ''

    // Post to each account
    for (const account of postAccounts) {
      try {
        // TODO: Handle image uploads
        const mediaIds: string[] = []

        let tweetIds: string[]

        if (post.postType === 'thread' && texts.length > 1) {
          // Post as thread
          const result = await postThread(account.accessToken, texts, mediaIds)
          tweetIds = result.ids
        } else {
          // Post as single tweet
          const result = await postTweet(
            account.accessToken,
            texts[0] || post.text,
            mediaIds
          )
          tweetIds = [result.id]
        }

        // Mark as posted for this account
        db.prepare(
          `
          UPDATE post_accounts
          SET posted = 1,
              posted_tweet_id = ?,
              posted_at = ?
          WHERE post_id = ? AND account_id = ?
        `
        ).run(
          tweetIds.join(','),
          new Date().toISOString(),
          post.id,
          account.accountId
        )

        console.log(
          `Successfully posted to account ${account.accountId}: ${tweetIds.join(', ')}`
        )
      } catch (error: any) {
        console.error(
          `Error posting to account ${account.accountId}:`,
          error.message
        )
        allSuccess = false
        errorMessage += `Account ${account.accountId}: ${error.message}\n`

        // Update error for this account
        db.prepare(
          `
          UPDATE post_accounts
          SET error_message = ?
          WHERE post_id = ? AND account_id = ?
        `
        ).run(error.message, post.id, account.accountId)
      }
    }

    // Update post status
    if (allSuccess) {
      db.prepare(
        `
        UPDATE posts
        SET status = 'posted',
            posted_at = ?,
            updated_at = ?
        WHERE id = ?
      `
      ).run(new Date().toISOString(), new Date().toISOString(), post.id)

      console.log(`Post ${post.id} published successfully`)
    } else {
      // Some accounts failed - check if we should retry
      const newRetryCount = post.retryCount + 1

      if (newRetryCount < post.maxRetryCount) {
        // Schedule retry
        db.prepare(
          `
          UPDATE posts
          SET status = 'retrying',
              retry_count = ?,
              error_message = ?,
              updated_at = ?
          WHERE id = ?
        `
        ).run(
          newRetryCount,
          errorMessage,
          new Date().toISOString(),
          post.id
        )

        // Schedule next retry (add retry_interval minutes)
        const retryInterval = 15 // minutes - should come from settings
        const retryTime = new Date(Date.now() + retryInterval * 60 * 1000)
        const retryDate = retryTime.toISOString().split('T')[0]
        const retryTimeStr = `${retryTime.getHours().toString().padStart(2, '0')}:${retryTime.getMinutes().toString().padStart(2, '0')}`

        db.prepare(
          `
          UPDATE posts
          SET scheduled_date = ?,
              scheduled_time = ?
          WHERE id = ?
        `
        ).run(retryDate, retryTimeStr, post.id)

        console.log(
          `Post ${post.id} scheduled for retry ${newRetryCount}/${post.maxRetryCount} at ${retryDate} ${retryTimeStr}`
        )
      } else {
        // Max retries reached
        db.prepare(
          `
          UPDATE posts
          SET status = 'failed',
              error_message = ?,
              updated_at = ?
          WHERE id = ?
        `
        ).run(errorMessage, new Date().toISOString(), post.id)

        console.log(`Post ${post.id} failed after ${post.maxRetryCount} retries`)
      }
    }
  } catch (error: any) {
    console.error(`Error processing post ${post.id}:`, error.message)

    // Mark as failed
    db.prepare(
      `
      UPDATE posts
      SET status = 'failed',
          error_message = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(error.message, new Date().toISOString(), post.id)
  }
}

/**
 * Manually trigger a post to be published immediately
 */
export async function publishPostNow(postId: string): Promise<void> {
  const post = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(postId) as ScheduledPost | undefined

  if (!post) {
    throw new Error('Post not found')
  }

  if (post.status !== 'scheduled') {
    throw new Error('Post is not in scheduled status')
  }

  await processPost(post)
}
