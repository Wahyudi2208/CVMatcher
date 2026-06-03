import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { parseFile } from '../services/fileParser.js'

export const createSession = async (req, res) => {
    try {
        const userId = req.user?.id || null // dari JWT kalau login

        const session = await prisma.uploadSession.create({
            data: {
                userId,
                token: uuidv4()
            }
        })

        res.json({
            message: 'Session created',
            session
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const uploadCV = async (req, res) => {
    try {
        console.log('FILES:', req.files)
        const { sessionId } = req.body

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' })
        }

        // Cek jumlah CV
        const existing = await prisma.cVFile.count({
            where: { sessionId: Number(sessionId) }
        })

        const isLoggedIn = !!req.user
        const max = isLoggedIn ? 20 : 10

        if (existing + req.files.length > max) {
            return res.status(400).json({
                error: `Max CV upload is ${max}`
            })
        }

        const data = req.files.map(file => {
            const ext = file.originalname.split('.').pop()
            return {
                fileName: file.originalname,
                filePath: file.path,
                fileType: ext,
                sessionId: Number(sessionId)
            }
        })

        await prisma.cVFile.createMany({ data })

        res.json({
            message: 'CV uploaded successfully'
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const uploadJob = async (req, res) => {
    try {
        const { sessionId, content } = req.body

        const existing = await prisma.jobDescriptionFile.findUnique({
            where: { sessionId: Number(sessionId) }
        })

        // Digunakan jika ingin update file/job description yang sudah ada
        //  if (existing) {
        //     await prisma.jobDescriptionFile.update({
        //         where: { sessionId: Number(sessionId) },
        //         data: {
        //             content: content || null,
        //             fileName: req.file?.originalname || null,
        //             filePath: req.file?.path || null,
        //             fileType: req.file
        //                 ? req.file.originalname.split('.').pop()
        //                 : null
        //         }
        //     })

        //     return res.json({
        //         message: 'Job description updated'
        //     })
        // }

        if (existing) {
            return res.status(400).json({
                error: 'Job description already exists'
            })
        }

        let data = {
            sessionId: Number(sessionId)
        }

        // Manual text
        if (content) {
            data.content = content
        }

        // Upload file
        if (req.file) {
            data.fileName = req.file.originalname
            data.filePath = req.file.path
            data.fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'docx'
        }

        await prisma.jobDescriptionFile.create({ data })

        res.json({
            message: 'Job description uploaded'
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const analyzeSession = async (req, res) => {
    try {
        const { sessionId } = req.params

        // Ambil session + relasi
        const session = await prisma.uploadSession.findUnique({
            where: {
                id: Number(sessionId)
            },
            include: {
                cvs: true,
                job: true
            }
        })

        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            })
        }

        if (!session.job) {
            return res.status(400).json({
                error: 'Job description not found'
            })
        }

        // Parse Job Description
        let jobText = ''

        // Jika manual text
        if (session.job.content) {
            jobText = session.job.content
        }

        // Jika file
        else if (session.job.filePath) {
            jobText = await parseFile(
                session.job.filePath,
                session.job.fileType
            )
        }

        // Parse CV Files
        const parsedCVs = []

        for (const cv of session.cvs) {
            const text = await parseFile(
                cv.filePath,
                cv.fileType
            )

            parsedCVs.push({
                id: cv.id,
                fileName: cv.fileName,
                text
            })
        }

        // TEMP RESPONSE
        res.json({
            message: 'Parsing success',
            jobText,
            cvs: parsedCVs
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: error.message
        })
    }
}