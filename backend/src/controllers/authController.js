import { prisma } from '../lib/prisma.js'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { sendOTPEmail } from "../services/emailService.js";
import { generateOTP } from "../services/otpService.js";

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
        expiresIn: '30d'
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: "Email wajib diisi."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    // Jangan bocorkan apakah email terdaftar
    if (!user) {
      return res.status(200).json({
        message:
          "Jika email terdaftar, kode OTP akan dikirim."
      });
    }

    const otp = generateOTP();
    const hashedOTP = await argon2.hash(otp);
    const expiresAt =
      new Date(
        Date.now() + 2 * 60 * 1000
      );
    // Hapus OTP lama
    await prisma.passwordResetOTP.deleteMany({
      where: {
        email
      }
    });

    // Simpan OTP baru
    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp: hashedOTP,
        expiresAt,
        attempts: 0,
        verified: false,
      }
    });
    await sendOTPEmail(
      email,
      otp
    );

    return res.status(200).json({
      message:
        "Jika email terdaftar, kode OTP akan dikirim."
    });
  }

  catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const {
      email,
      otp
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: "Email dan OTP wajib diisi."
      });
    }

    const resetData =
      await prisma.passwordResetOTP.findFirst({
        where: {
          email
        }
      });

    if (!resetData) {
      return res.status(400).json({
        error: "OTP tidak ditemukan."
      });
    }

    // OTP sudah expired
    if (new Date() > resetData.expiresAt) {
      await prisma.passwordResetOTP.delete({
        where: {
          id: resetData.id
        }
      });

      return res.status(400).json({
        error: "OTP telah kedaluwarsa."
      });
    }

    // Maksimal 5 percobaan
    if (resetData.attempts >= 5) {
      await prisma.passwordResetOTP.delete({
        where: {
          id: resetData.id
        }
      });

      return res.status(400).json({
        error:
          "Terlalu banyak percobaan. Silakan minta OTP baru."
      });
    }
    const isValid =
      await argon2.verify(
        resetData.otp,
        otp
      );

    if (!isValid) {
      await prisma.passwordResetOTP.update({
        where: {
          id: resetData.id
        },
        data: {
          attempts: {
            increment: 1
          }
        }
      });

      return res.status(400).json({
        error: "Kode OTP salah."
      });
    }

    await prisma.passwordResetOTP.update({
      where: {
        id: resetData.id
      },
      data: {
        verified: true
      }
    });

    return res.status(200).json({
      message: "OTP berhasil diverifikasi."
    });
  }

  catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email dan password wajib diisi."
      });
    }

    // Validasi password (sama seperti register)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan simbol."
      });
    }

    const resetData =
      await prisma.passwordResetOTP.findFirst({
        where: {
          email
        }
      });

    if (!resetData) {
      return res.status(400).json({
        error:
          "Silakan lakukan verifikasi OTP terlebih dahulu."
      });
    }

    if (!resetData.verified) {
      return res.status(400).json({
        error:
          "OTP belum diverifikasi."
      });
    }

    const hashedPassword = await argon2.hash(password);
    await prisma.user.update({
      where: {
        email
      },
      data: {
        password: hashedPassword
      }
    });

    // Hapus OTP setelah password berhasil diganti
    await prisma.passwordResetOTP.delete({
      where: {
        id: resetData.id
      }
    });

    return res.status(200).json({
      message:
        "Kata sandi berhasil diubah."
    });
  }

  catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
};