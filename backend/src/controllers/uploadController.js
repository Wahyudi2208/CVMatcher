import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { parseFile } from '../services/fileParser.js'
import { calculateSimilarity } from '../utils/similarity.js'

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
        if (isNaN(Number(sessionId))) {
            return res.status(400).json({
                error: 'Invalid session ID'
            })
        }

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
        if (isNaN(Number(sessionId))) {
            return res.status(400).json({
                error: 'Invalid session ID'
            })
        }

        // Validasi Input Job Description
        // Memerik apakah ada file yang diupload
        const hasFile = !!req.file

        // Memeriksa apakah ada text yang diinput
        const hasContent =
            typeof content === 'string' &&
            content.trim().length > 0

        // Jika tidak ada file dan tidak ada text
        if (!hasFile && !hasContent) {
            return res.status(400).json({
                error: 'Job description is required'
            })
        }

        // Jika file dan text diisi bersamaan
        if (hasFile && hasContent) {
            return res.status(400).json({
                error: 'Choose either file upload or text input, not both'
            })
        }

        const existing = await prisma.jobDescriptionFile.findUnique({
            where: { sessionId: Number(sessionId) }
        })

        if (existing) {
            return res.status(400).json({
                error: 'Job description already exists'
            })
        }

        let data = {
            sessionId: Number(sessionId)
        }

        // Simpan Manual Text
        // Hanya simpan jika text benar-benar ada
        if (hasContent) {
            data.content = content.trim()
        }

        // Upload file
        if (req.file) {
            data.fileName = req.file.originalname
            data.filePath = req.file.path
            data.fileType = req.file.originalname
                .split('.')
                .pop()
                .toLowerCase()
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
        if (isNaN(Number(sessionId))) {
            return res.status(400).json({
                error: 'Invalid session ID'
            })
        }

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

        // Pastikan minimal ada 1 CV
        if (session.cvs.length === 0) {
            return res.status(400).json({
                error: 'No CV uploaded'
            })
        }

        // Hapus hasil lama
        await prisma.analysisResult.deleteMany({
            where: {
                sessionId: session.id
            }
        })

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
        const analyzedCVs = []

        for (const cv of session.cvs) {

            const text = await parseFile(
                cv.filePath,
                cv.fileType
            )

            // Hitung Similarity
            const score = calculateSimilarity(
                jobText,
                text
            )

            analyzedCVs.push({
                id: cv.id,
                fileName: cv.fileName,
                score
            })

            // Simpan hasil ke database
            await prisma.analysisResult.create({
                data: {
                    sessionId: session.id,
                    cvFileId: cv.id,
                    score
                }
            })
        }

        analyzedCVs.sort((a, b) => b.score - a.score)

        await prisma.uploadSession.update({
            where: {
                id: session.id
            },
            data: {
                status: 'PROCESSED'
            }
        })

        res.json({
            message: 'Analysis Success',
            results: analyzedCVs
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: error.message
        })
    }
}

export const getResults = async (req, res) => {
    try {
        const { sessionId } = req.params
        if (isNaN(Number(sessionId))) {
            return res.status(400).json({
                error: 'Invalid session ID'
            })
        }

        const results = await prisma.analysisResult.findMany({
            where: {
                sessionId: Number(sessionId)
            },
            include: {
                cvFile: true
            },
            orderBy: {
                score: 'desc'
            }
        })

        res.json({
            message: 'Results fetched successfully',
            results
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params

        const session =
            await prisma.uploadSession.findUnique({
                where: {
                    id: Number(sessionId)
                },
                select: {
                    id: true,
                    status: true,
                    title: true,
                    userId: true,
                    createdAt: true
                }
            })

        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            })
        }

        res.json(session)

    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: error.message
        })
    }
}