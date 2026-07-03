import express from 'express'
import { upload } from '../middlewares/uploadMiddleware.js'
import { authenticate, uploadAuth } from '../middlewares/authMiddleware.js'
import {
    createSession,
    uploadCV,
    uploadJob,
    analyzeSession,
    getResults,
    getSession,
    getResultDetail,
    getHistory,
    renameHistory,
    deleteHistory
} from '../controllers/uploadController.js'

const router = express.Router()

// Create session
router.post('/session', uploadAuth, createSession)

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

router.get(
    '/result/:resultId',
    getResultDetail
)

// Ambil session
router.get(
    '/session/:sessionId',
    getSession
)

router.get(
    "/history",
    authenticate,
    getHistory
);

router.patch(
    "/history/:sessionId",
    authenticate,
    renameHistory
);

router.delete(
    "/history/:sessionId",
    authenticate,
    deleteHistory
);

export default router