import express from 'express'
import cors from 'cors'
import { config, validateConfig } from './config'
import { initDatabase } from './models/database'
import router from './routes'
import { startScheduler } from './services/schedulerService'
import path from 'path'
import fs from 'fs'

// Validate configuration
validateConfig()

// Initialize Express app
const app = express()

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// API routes
app.use('/api', router)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  })
})

// Initialize database
function initializeApp() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('Created data directory')
    }

    // Initialize database tables
    initDatabase()

    // Start the scheduler
    startScheduler()

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   imadio autopost API Server                  ║
║                                               ║
║   🚀 Server running on port ${config.port}           ║
║   📝 Environment: ${config.nodeEnv}               ║
║   🔗 Frontend URL: ${config.frontendUrl}     ║
║                                               ║
║   📡 API Documentation:                       ║
║   - Health: GET /api/health                   ║
║   - Auth: POST /api/auth/register|login       ║
║   - X Auth: GET /api/auth/x/initiate          ║
║   - Posts: /api/posts                         ║
║   - Settings: /api/settings                   ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('Failed to initialize app:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})

// Start the application
initializeApp()
