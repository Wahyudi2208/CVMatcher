import express from 'express'
import { upload } from '../middlewares/uploadMiddleware.js'
import { uploadAuth } from '../middlewares/authMiddleware.js'
import {
    createSession,
    uploadCV,
    uploadJob,
    analyzeSession,
    getResults,
    getSession
} from '../controllers/uploadController.js'

const router = express.Router()

// Create session
router.post('/session', createSession)

// Upload CV (20 untuk login, 10 untuk guest)
router.post(
    '/cv',
    uploadAuth,
    upload.array('cvs', 20),
    uploadCV
)

// Upload Job Description (hanya 1 file)
router.post(
    '/job',
    uploadAuth,
    upload.single('job'),
    uploadJob
)

// Analisis file
router.post(
    '/analyze/:sessionId',
    analyzeSession
)

// Ambil hasil analisis
router.get(
    '/results/:sessionId',
    getResults
)

// Ambil session
router.get(
    '/session/:sessionId',
    getSession
)

export default router