import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import * as authController from '../controllers/authController'
import * as xAuthController from '../controllers/xAuthController'
import * as postsController from '../controllers/postsController'
import * as settingsController from '../controllers/settingsController'

const router = Router()

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth routes
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticateToken, authController.getCurrentUser)

// X OAuth routes
router.get('/auth/x/initiate', authenticateToken, xAuthController.initiateXAuth)
router.get('/auth/x/callback', xAuthController.handleXCallback)
router.get('/x-accounts', authenticateToken, xAuthController.getXAccounts)
router.put(
  '/x-accounts/:accountId/disconnect',
  authenticateToken,
  xAuthController.disconnectXAccount
)
router.delete(
  '/x-accounts/:accountId',
  authenticateToken,
  xAuthController.deleteXAccount
)
router.put(
  '/x-accounts/:accountId/type',
  authenticateToken,
  xAuthController.updateAccountType
)

// Posts routes
router.post('/posts', authenticateToken, postsController.createPost)
router.get('/posts', authenticateToken, postsController.getPosts)
router.get('/posts/:postId', authenticateToken, postsController.getPost)
router.put('/posts/:postId', authenticateToken, postsController.updatePost)
router.delete('/posts/:postId', authenticateToken, postsController.deletePost)

// Settings routes
router.get('/settings', authenticateToken, settingsController.getSettings)
router.put('/settings', authenticateToken, settingsController.updateSettings)

export default router
