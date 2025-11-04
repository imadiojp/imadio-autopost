import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-this',
  databasePath: process.env.DATABASE_PATH || './data/imadio.db',

  // X API Configuration
  xApi: {
    clientId: process.env.X_API_CLIENT_ID || '',
    clientSecret: process.env.X_API_CLIENT_SECRET || '',
    callbackUrl: process.env.X_API_CALLBACK_URL || 'http://localhost:3001/api/auth/x/callback',
  },

  // Frontend URL for CORS and redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',

  // SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

// Validate required environment variables
export function validateConfig() {
  const requiredVars = [
    'JWT_SECRET',
    'X_API_CLIENT_ID',
    'X_API_CLIENT_SECRET',
  ]

  const missing = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === ''
  )

  if (missing.length > 0 && config.nodeEnv !== 'development') {
    console.warn(
      `Warning: Missing required environment variables: ${missing.join(', ')}`
    )
    console.warn('The application may not work correctly without these.')
  }
}
