import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/profile')
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1E9)

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        )
    }
})

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                'Hanya file JPG, JPEG, dan PNG yang diperbolehkan'
            )
        )
    }
}

export const uploadProfileImage = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
})