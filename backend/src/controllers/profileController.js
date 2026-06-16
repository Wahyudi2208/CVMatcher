import { prisma } from '../lib/prisma.js'
import argon2 from 'argon2'
import fs from 'fs'
import path from 'path'

export const getProfile = async (req, res) => {
    try {

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
                profileImage: true
            }
        })

        if (!user) {
            return res.status(404).json({
                error: 'User tidak ditemukan'
            })
        }

        return res.status(200).json(user)

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        })

    }
}

export const updateDisplayName = async (req, res) => {
    try {

        const { displayName } = req.body

        if (
            displayName &&
            displayName.length > 10
        ) {
            return res.status(400).json({
                error: 'Display name maksimal 10 karakter'
            })
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                displayName:
                    displayName?.trim() || null
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
                profileImage: true
            }
        })

        return res.status(200).json({
            message: 'Display name berhasil diperbarui',
            user: updatedUser
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        })

    }
}

export const updateProfile = async (req, res) => {
    try {

        const {
            name,
            email,
            oldPassword,
            newPassword,
            confirmPassword
        } = req.body

        const updateData = {}

        // Full Name
        if (name !== undefined) {

            const trimmedName = name.trim()

            if (!trimmedName) {
                return res.status(400).json({
                    error: 'Full name wajib diisi'
                })
            }

            if (trimmedName.length > 30) {
                return res.status(400).json({
                    error: 'Full name maksimal 30 karakter'
                })
            }

            const nameRegex = /^[A-Za-z\s]+$/

            if (!nameRegex.test(trimmedName)) {
                return res.status(400).json({
                    error: 'Full name hanya boleh huruf dan spasi'
                })
            }

            updateData.name = trimmedName
        }

        // Email
        if (email !== undefined) {

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Format email tidak valid'
                })
            }

            const existingUser = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: {
                        id: req.user.id
                    }
                }
            })

            if (existingUser) {
                return res.status(400).json({
                    error: 'Email sudah digunakan'
                })
            }

            updateData.email = email
        }

        // Password
        const passwordFieldsFilled =
            oldPassword ||
            newPassword ||
            confirmPassword

        if (passwordFieldsFilled) {

            if (
                !oldPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                return res.status(400).json({
                    error:
                        'Old password, new password, dan confirm password wajib diisi'
                })
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    error:
                        'New password dan confirm password tidak sesuai'
                })
            }

            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    error:
                        'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol'
                })
            }

            const currentUser = await prisma.user.findUnique({
                where: {
                    id: req.user.id
                }
            })

            const isPasswordValid =
                await argon2.verify(
                    currentUser.password,
                    oldPassword
                )

            if (!isPasswordValid) {
                return res.status(400).json({
                    error: 'Password lama tidak sesuai'
                })
            }

            updateData.password =
                await argon2.hash(newPassword)
        }

        // Update
        const updatedUser =
            await prisma.user.update({
                where: {
                    id: req.user.id
                },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    email: true,
                    profileImage: true
                }
            })

        return res.status(200).json({
            message: 'Profil berhasil diperbarui',
            user: updatedUser
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        })

    }
}

export const uploadProfilePhoto = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                error: 'File gambar wajib diupload'
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        })

        // hapus foto lama
        if (user.profileImage) {

            const oldPath = path.join(
                process.cwd(),
                user.profileImage
            )

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath)
            }
        }

        const imagePath =
            `/uploads/profile/${req.file.filename}`

        const updatedUser =
            await prisma.user.update({
                where: {
                    id: req.user.id
                },
                data: {
                    profileImage: imagePath
                },
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    email: true,
                    profileImage: true
                }
            })

        return res.status(200).json({
            message: 'Foto profil berhasil diperbarui',
            user: updatedUser
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        })

    }
}

export const verifyOldPassword = async (req, res) => {

    try {

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });

        const { oldPassword } = req.body;

        const isMatch =
            await argon2.verify(
                user.password,
                oldPassword
            );

        if (!isMatch) {
            return res.status(400).json({
                error: "Password lama tidak sesuai"
            });
        }

        return res.status(200).json({
            message: "Password valid"
        });

    } catch (error) {

        return res.status(500).json({
            error: "Server error"
        });

    }
};