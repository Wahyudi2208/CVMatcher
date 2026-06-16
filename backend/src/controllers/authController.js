import { prisma } from '../lib/prisma.js'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

// Function register
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    const errors = {}

    if (!name) errors.name = 'Nama wajib diisi'
    const nameRegex = /^[A-Za-z\s]+$/;
    if (name && !nameRegex.test(name)) {
      errors.name = 'Nama hanya boleh huruf dan spasi';
    }
    if (!email) errors.email = 'Email wajib diisi'
    if (!password) errors.password = 'Kata sandi wajib diisi'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        errors: {
          password:
            "Kata sandi minimal 8 karakter, mengandung huruf besar, huruf kecil, dan simbol.",
        },
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        errors: { email: "Format email tidak valid" }
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        errors: {
          email: 'Email sudah digunakan'
        }
      })
    }

    const hashedPassword = await argon2.hash(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    })

    res.status(201).json({
      message: 'User created',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
}

// Function login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const errors = {}

    if (!email) errors.email = 'Email wajib diisi'
    if (!password) errors.password = 'Kata sandi wajib diisi'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({
        message: 'Email atau kata sandi salah'
      })
    }

    const isPasswordValid = await argon2.verify(user.password, password)

    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Email atau kata sandi salah'
      })
    }

    // Genenerate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    )

    return res.status(200).json({
      message: 'Berhasil masuk',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Server error'
    })
  }
}