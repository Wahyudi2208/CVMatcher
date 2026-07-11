import express from 'express'
import { login, register, getCurrentUser, forgotPassword, verifyOTP, resetPassword } from '../controllers/authController.js'
import { loginLimiter } from '../middlewares/rateLimiter.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.get('/me', authenticate, getCurrentUser)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router