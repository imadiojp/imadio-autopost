import { TwitterApi } from 'twitter-api-v2'
import { config } from '../config'
import db from '../models/database'

export interface XAccount {
  id: string
  displayName: string
  username: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
}

/**
 * Create Twitter API client for a specific account
 */
export function createXClient(accessToken: string): TwitterApi {
  return new TwitterApi(accessToken)
}

/**
 * Get OAuth 2.0 authorization URL for X login
 */
export function getAuthUrl(state: string): string {
  const client = new TwitterApi({
    clientId: config.xApi.clientId,
    clientSecret: config.xApi.clientSecret,
  })

  const { url, codeVerifier } = client.generateOAuth2AuthLink(
    config.xApi.callbackUrl,
    {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      state,
    }
  )

  // Store codeVerifier temporarily (in production, use Redis or session storage)
  // For now, we'll return it and expect the callback to provide it
  return url
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}> {
  const client = new TwitterApi({
    clientId: config.xApi.clientId,
    clientSecret: config.xApi.clientSecret,
  })

  const {
    client: loggedClient,
    accessToken,
    refreshToken,
    expiresIn,
  } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: config.xApi.callbackUrl,
  })

  return {
    accessToken,
    refreshToken,
    expiresIn,
  }
}

/**
 * Get user information from X API
 */
export async function getXUserInfo(accessToken: string) {
  const client = createXClient(accessToken)
  const user = await client.v2.me({
    'user.fields': ['profile_image_url', 'username', 'name'],
  })

  return {
    id: user.data.id,
    username: `@${user.data.username}`,
    displayName: user.data.name,
    avatar: user.data.profile_image_url,
  }
}

/**
 * Post a single tweet
 */
export async function postTweet(
  accessToken: string,
  text: string,
  mediaIds?: string[]
): Promise<{ id: string }> {
  const client = createXClient(accessToken)

  const tweetData: any = { text }
  if (mediaIds && mediaIds.length > 0) {
    tweetData.media = { media_ids: mediaIds }
  }

  const tweet = await client.v2.tweet(tweetData)
  return { id: tweet.data.id }
}

/**
 * Post a thread (multiple tweets)
 */
export async function postThread(
  accessToken: string,
  texts: string[],
  mediaIds?: string[]
): Promise<{ ids: string[] }> {
  const client = createXClient(accessToken)
  const tweetIds: string[] = []

  let previousTweetId: string | undefined

  for (let i = 0; i < texts.length; i++) {
    const tweetData: any = { text: texts[i] }

    // Add media only to the first tweet
    if (i === 0 && mediaIds && mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds }
    }

    // Add reply to previous tweet for threading
    if (previousTweetId) {
      tweetData.reply = { in_reply_to_tweet_id: previousTweetId }
    }

    const tweet = await client.v2.tweet(tweetData)
    tweetIds.push(tweet.data.id)
    previousTweetId = tweet.data.id
  }

  return { ids: tweetIds }
}

/**
 * Upload media to X
 */
export async function uploadMedia(
  accessToken: string,
  mediaBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const client = createXClient(accessToken)

  const mediaId = await client.v1.uploadMedia(mediaBuffer, {
    mimeType,
  })

  return mediaId
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}> {
  const client = new TwitterApi({
    clientId: config.xApi.clientId,
    clientSecret: config.xApi.clientSecret,
  })

  const {
    client: refreshedClient,
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  } = await client.refreshOAuth2Token(refreshToken)

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  }
}

/**
 * Verify if access token is still valid
 */
export async function verifyToken(accessToken: string): Promise<boolean> {
  try {
    const client = createXClient(accessToken)
    await client.v2.me()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get account type (free or premium) by checking character limits
 * This is a simplified check - in reality, you'd need to use X API v2 to check subscription status
 */
export async function getAccountType(
  accessToken: string
): Promise<'free' | 'premium'> {
  // For now, we'll default to free
  // In production, implement proper X API Premium/Blue verification
  return 'free'
}
