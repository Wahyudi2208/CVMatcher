import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/')
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const fileName = `${uuidv4()}${ext}`
        cb(null, fileName)
    }
})

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('Only PDF, DOC, DOCX allowed'), false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
})