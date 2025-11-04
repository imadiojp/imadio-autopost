import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'imadio.db'))

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize database tables
export function initDatabase() {
  // Users table (for app authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // X Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS x_accounts (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('free', 'premium')),
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expires_at DATETIME,
      is_connected INTEGER DEFAULT 1,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('scheduled', 'posting', 'posted', 'failed', 'retrying')),
      post_type TEXT NOT NULL CHECK(post_type IN ('single', 'thread')),
      thread_count INTEGER DEFAULT 1,
      retry_count INTEGER DEFAULT 0,
      max_retry_count INTEGER DEFAULT 3,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      posted_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Post images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_images (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      url TEXT NOT NULL,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)

  // Post accounts junction table (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_accounts (
      post_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      posted INTEGER DEFAULT 0,
      posted_tweet_id TEXT,
      posted_at DATETIME,
      error_message TEXT,
      PRIMARY KEY (post_id, account_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES x_accounts(id) ON DELETE CASCADE
    )
  `)

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      timezone TEXT DEFAULT 'Asia/Tokyo',
      bulk_pause INTEGER DEFAULT 0,
      email_notifications INTEGER DEFAULT 0,
      email TEXT,
      auto_retry INTEGER DEFAULT 1,
      max_retry_count INTEGER DEFAULT 3,
      retry_interval INTEGER DEFAULT 15,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  console.log('Database initialized successfully')
}

export default db
