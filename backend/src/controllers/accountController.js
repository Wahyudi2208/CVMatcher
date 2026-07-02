import { prisma } from '../lib/prisma.js'

export const deleteAccount = async (req, res) => {
    try {

        const userId = req.user.id

        const sessions = await prisma.uploadSession.findMany({
            where: {
                userId
            },
            include: {
                cvs: true,
                results: true,
                job: true
            }
        })

        for (const session of sessions) {

            await prisma.analysisResult.deleteMany({
                where: {
                    sessionId: session.id
                }
            })

            await prisma.cVFile.deleteMany({
                where: {
                    sessionId: session.id
                }
            })

            await prisma.jobDescriptionFile.deleteMany({
                where: {
                    sessionId: session.id
                }
            })

            await prisma.uploadSession.delete({
                where: {
                    id: session.id
                }
            })
        }

        await prisma.user.delete({
            where: {
                id: userId
            }
        })

        return res.json({
            success: true,
            message:
                'Account deleted successfully'
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            success: false,
            message:
                'Failed to delete account'
        })
    }
}