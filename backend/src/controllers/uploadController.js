import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { parseFile } from '../services/fileParser.js'
import { calculateSimilarity } from '../utils/similarity.js'
import { analyzeBatchCV } from '../services/aiService.js'

export const createSession = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        const guestId =
            userId
                ? null
                : req.body?.guestId;

        if (!userId && guestId) {
            const expiredDate = new Date(
                Date.now() - 24 * 60 * 60 * 1000
            );

            const expiredSessions =
                await prisma.uploadSession.findMany({
                    where: {
                        guestId,
                        createdAt: {
                            lt: expiredDate
                        }
                    },
                    select: {
                        id: true
                    }
                });

            if (expiredSessions.length > 0) {
                const sessionIds =
                    expiredSessions.map(
                        s => s.id
                    );

                await prisma.$transaction([
                    prisma.analysisResult.deleteMany({
                        where: {
                            sessionId: {
                                in: sessionIds
                            }
                        }
                    }),

                    prisma.cVFile.deleteMany({
                        where: {
                            sessionId: {
                                in: sessionIds
                            }
                        }
                    }),

                    prisma.jobDescriptionFile.deleteMany({
                        where: {
                            sessionId: {
                                in: sessionIds
                            }
                        }
                    }),

                    prisma.uploadSession.deleteMany({
                        where: {
                            id: {
                                in: sessionIds
                            }
                        }
                    })
                ]);
            }
        }
        const session =
            await prisma.uploadSession.create({
                data: {
                    userId,
                    guestId,
                    token: uuidv4()
                }
            });

        res.json({
            message: "Session created",
            session
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });

    }
};

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

        let sessionTitle = "Manual Job Description";

        if (req.file) {
            sessionTitle = req.file.originalname.replace(/\.[^/.]+$/, "");
        }

        await prisma.uploadSession.update({
            where: {
                id: Number(sessionId)
            },
            data: {
                title: sessionTitle
            }
        });

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

        const aiResult = await analyzeBatchCV(
            session.cvs,
            jobText,
            session.title
        )

        console.log(JSON.stringify(aiResult, null, 2))

        const analyzedCVs = []

        for (const candidate of aiResult.ranked) {
            console.log('DATABASE CVS:')
            console.log(session.cvs)
            console.log('AI RESULT:')
            console.log(candidate.id)
            const cv = session.cvs.find(
                item => item.filePath.endsWith(candidate.id)
            )

            if (!cv) continue

            const cvText = await parseFile(
                cv.filePath,
                cv.fileType
            )

            analyzedCVs.push({
                id: cv.id,
                fileName: cv.fileName,
                score: candidate.final_score
            })

            await prisma.analysisResult.create({
                data: {
                    sessionId: session.id,
                    cvFileId: cv.id,
                    score: candidate.final_score,
                    label: candidate.label?.[0],
                    reasoning: candidate.reasoning,
                    candidateName: candidate.candidate_name,
                    matchedSkills: candidate.matched_skills,
                    unmatchedSkills: candidate.unmatched_skills,
                    cvContent: cvText
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

        const session = await prisma.uploadSession.findUnique({
            where: {
                id: Number(sessionId)
            },
            include: {
                job: true
            }
        })

        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            })
        }

        // Registered Session
        if (session.userId !== null) {
            if (!req.user) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            if (Number(req.user.id) !== Number(session.userId)) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }

        // Guest Session
        else {
            const guestId = req.headers["x-guest-id"];
            if (!guestId) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            if (guestId !== session.guestId) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }

        const results = await prisma.analysisResult.findMany({
            where: {
                sessionId: Number(sessionId)
            },
            include: {
                cvFile: true,
                session: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                score: 'desc'
            }
        })

        res.json({
            message: 'Results fetched successfully',
            jobDescription: session.job,
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

export const getResultDetail = async (req, res) => {
    try {
        const { resultId } = req.params
        const result =
            await prisma.analysisResult.findUnique({
                where: {
                    id: Number(resultId)
                },
                include: {
                    cvFile: true,
                    session: true
                }
            })

        if (!result) {
            return res.status(404).json({
                error: 'Result not found'
            })
        }

        // Registered
        if (result.session.userId !== null) {
            if (!req.user) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            if (
                Number(req.user.id) !==
                Number(result.session.userId)
            ) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }
        // Guest
        else {
            const guestId = req.headers["x-guest-id"];
            if (!guestId) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            if (guestId !== result.session.guestId) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }

        }

        delete result.session;
        res.json(result)

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const getHistory = async (req, res) => {
    try {
        const histories =
            await prisma.uploadSession.findMany({
                where: {
                    userId: req.user.id,
                    status: "PROCESSED"
                },
                select: {
                    id: true,
                    title: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

        res.json(histories);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

export const renameHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;
        const session =
            await prisma.uploadSession.findUnique({
                where: {
                    id: Number(sessionId)
                }
            });

        if (!session) {
            return res.status(404).json({
                error: "History not found"
            });
        }

        if (session.userId !== req.user.id) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await prisma.uploadSession.update({
            where: {
                id: Number(sessionId)
            },
            data: {
                title
            }
        });

        res.json({
            message: "History renamed"
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

export const deleteHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session =
            await prisma.uploadSession.findUnique({
                where: {
                    id: Number(sessionId)
                }
            });

        if (!session) {
            return res.status(404).json({
                error: "History not found"
            });
        }

        if (
            session.userId !== req.user.id
        ) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.analysisResult.deleteMany({
                where: {
                    sessionId: Number(sessionId)
                }
            });

            await tx.cVFile.deleteMany({
                where: {
                    sessionId: Number(sessionId)
                }
            });

            await tx.jobDescriptionFile.deleteMany({
                where: {
                    sessionId: Number(sessionId)
                }
            });

            await tx.uploadSession.delete({
                where: {
                    id: Number(sessionId)
                }
            });
        });

        res.json({
            message: "History deleted"
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

export const deleteAllHistory = async (req, res) => {
    try {
        const sessions =
            await prisma.uploadSession.findMany({
                where: {
                    userId: req.user.id
                },
                select: {
                    id: true
                }
            });

        if (sessions.length === 0) {
            return res.json({
                message: "No history found"
            });
        }

        const sessionIds =
            sessions.map(
                session => session.id
            );

        await prisma.$transaction([
            prisma.analysisResult.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.cVFile.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.jobDescriptionFile.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.uploadSession.deleteMany({
                where: {
                    id: {
                        in: sessionIds
                    }
                }
            })
        ]);

        res.json({
            message: "All history deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

export const deleteGuestSession = async (req, res) => {
    try {
        const { guestId } = req.body;
        if (!guestId) {
            return res.status(400).json({
                error: "Guest ID is required"
            });
        }

        const sessions =
            await prisma.uploadSession.findMany({
                where: {
                    guestId
                },
                select: {
                    id: true
                }
            });

        if (sessions.length === 0) {
            return res.json({
                message: "No session found"
            });
        }

        const sessionIds =
            sessions.map(
                s => s.id
            );

        await prisma.$transaction([
            prisma.analysisResult.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.cVFile.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.jobDescriptionFile.deleteMany({
                where: {
                    sessionId: {
                        in: sessionIds
                    }
                }
            }),

            prisma.uploadSession.deleteMany({
                where: {
                    id: {
                        in: sessionIds
                    }
                }
            })
        ]);

        res.json({
            message: "Guest session deleted"
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });

    }
};
