import express from 'express'
import { login, register, getCurrentUser } from '../controllers/authController.js'
import { loginLimiter } from '../middlewares/rateLimiter.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.get('/me', authenticate, getCurrentUser)

export default router