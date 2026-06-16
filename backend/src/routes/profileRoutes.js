import express from 'express'
import {
    getProfile,
    updateDisplayName,
    updateProfile,
    uploadProfilePhoto,
    verifyOldPassword
} from '../controllers/profileController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { uploadProfileImage } from '../middlewares/profileUploadMiddleware.js'

const router = express.Router()

router.get(
    '/',
    authenticate,
    getProfile
)

router.patch(
    '/display-name',
    authenticate,
    updateDisplayName
)

router.patch(
    '/',
    authenticate,
    updateProfile
)

router.post(
    '/photo',
    authenticate,
    uploadProfileImage.single('photo'),
    uploadProfilePhoto
)

router.post(
    "/verify-password",
    authenticate,
    verifyOldPassword
);

export default router