// Account Types
export type AccountType = 'free' | 'premium'

export interface Account {
  id: string
  displayName: string
  username: string
  avatar?: string
  isConnected: boolean
  accountType: AccountType
}

// Post Types
export type PostStatus = 'scheduled' | 'posting' | 'posted' | 'failed' | 'retrying'
export type PostType = 'single' | 'thread'

export interface PostImage {
  id: string
  url: string
  file?: File
  alt?: string
}

export interface Post {
  id: string
  text: string
  images: PostImage[]
  scheduledDate: string
  scheduledTime: string
  timezone: string
  accountIds: string[] // 投稿先アカウントのIDリスト
  status: PostStatus
  type: PostType
  threadCount: number
  createdAt: string
  updatedAt: string
  postedAt?: string
  retryCount?: number
  error?: string
}

// Settings Types
export interface Settings {
  timezone: string
  bulkPause: boolean
  emailNotifications: boolean
  email: string
  autoRetry: boolean
  maxRetryCount: number
  retryInterval: number // minutes
}

// Character limit based on account type
export const CHARACTER_LIMITS: Record<AccountType, number> = {
  free: 140, // 全角140字
  premium: 25000, // 全角25,000字
}
