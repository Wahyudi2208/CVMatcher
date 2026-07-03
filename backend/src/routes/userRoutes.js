import express from 'express'
import { authenticate } from '../middlewares/authMiddleware.js'
import { deleteAccount } from '../controllers/accountController.js'

const router = express.Router()

router.get('/me', authenticate, (req, res) => {
    res.json({
        message: 'User authenticated',
        user: req.user
    })
})

router.delete('/delete', authenticate, deleteAccount)

export default router