"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const isFormComplete =
        form.name.trim() &&
        form.email.trim() &&
        form.password &&
        form.confirmPassword &&
        agreed;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) {
            newErrors.name = "Nama wajib diisi.";
        } else {
            const nameRegex = /^[A-Za-z\s]+$/;

            if (!nameRegex.test(form.name)) {
                newErrors.name =
                    "Nama hanya boleh huruf dan spasi.";
            }
        }
        if (!form.email.trim()) {
            newErrors.email = "Email wajib diisi.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Format email tidak valid.";
        }
        if (!form.password) {
            newErrors.password = "Kata sandi wajib diisi.";
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

            if (!passwordRegex.test(form.password)) {
                newErrors.password =
                    "Kata sandi minimal 8 karakter, mengandung huruf besar, huruf kecil, dan simbol.";
            }
        }
        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
        }
        if (!agreed) newErrors.agreed = "Anda harus menyetujui syarat dan ketentuan.";
        return newErrors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                data = { message: "Terjadi kesalahan server" };
            }

            if (res.ok) {
                setForm({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });

                router.replace("/login?success=register");
            } else {
                if (data.errors) {
                    setErrors(data.errors)
                } else {
                    toast.error(data.error || "Registrasi gagal")
                }
            }

        } catch (error: any) {
            toast.error("Gagal terhubung ke server");
        }
    };

    const EyeIcon = ({ show }: { show: boolean }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {show ? (
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </>
            ) : (
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    );

    const CheckIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    const CVMatcherLogo = () => (
        <div className="flex items-center gap-2">
            <Image
                src="/img/logo-website.png"
                alt="CVMatcher Logo"
                width={90}
                height={90}
                className="rounded-md"
            />
            <span className="font-bold text-5xl tracking-tight">
                <span className="text-blue-800">CV</span>
                <span className="text-gray-900">Matcher</span>
            </span>
        </div>
    );

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            {/* Left Panel */}
            <div className="relative flex flex-col justify-center px-8 py-12 md:w-1/2 lg:w-[45%] bg-gradient-to-br from-[#1a7a6e] via-[#1e8a7a] to-[#2563a0]">
                <div className="max-w-md mx-auto w-full">
                    {/* Logo */}
                    <div className="mb-0">
                        <CVMatcherLogo />
                    </div>

                    {/* Headline */}
                    <h1 className="text-white text-4xl lg:text-5xl font-bold leading-tight mb-4">
                        Temukan kandidat terbaik dengan AI
                    </h1>
                    <p className="text-white/80 text-base leading-relaxed mb-10">
                        Analisis semantik NLP untuk keputusan rekrutmen yang lebih cepat dan akurat
                    </p>

                    {/* Features */}
                    <ul className="space-y-4">
                        {[
                            "Unggah CV massal dalam sekali klik",
                            "Analisis similaritas semantik otomatis",
                            "Peringkat kandidat berdasarkan kesesuaian",
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-400 text-white flex-shrink-0">
                                    <CheckIcon />
                                </span>
                                <span className="text-white/90 text-sm">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col justify-center px-6 py-12 md:w-1/2 lg:w-[55%] bg-white">
                <div className="max-w-md mx-auto w-full">
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">Buat akun baru</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Daftar untuk akses peringkat otomatis & penyarigan kandidat
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1.5">
                                Nama
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Masukkan nama Anda"
                                value={form.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition
                  focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                  ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition
                  focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                  ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Buat password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition
                    focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                    ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    aria-label="Toggle password visibility"
                                >
                                    <EyeIcon show={showPassword} />
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-1.5">
                                Konfirmasi Kata sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Masukkan ulang password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition
                    focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                    ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    aria-label="Toggle confirm password visibility"
                                >
                                    <EyeIcon show={showConfirmPassword} />
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Terms & Conditions */}
                        <div>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => {
                                        setAgreed(e.target.checked);
                                        setErrors({ ...errors, agreed: "" });
                                    }}
                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-600 flex-shrink-0"
                                />
                                <span className="text-sm text-gray-600 leading-snug">
                                    Saya setuju dengan{" "}
                                    <a href="#" className="text-blue-600 hover:underline font-medium">
                                        syarat dan ketentuan
                                    </a>{" "}
                                    serta{" "}
                                    <a href="#" className="text-blue-600 hover:underline font-medium">
                                        kebijakan privasi
                                    </a>
                                </span>
                            </label>
                            {errors.agreed && (
                                <p className="mt-1 text-xs text-red-500">{errors.agreed}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormComplete}
                            className={`w-full py-3 rounded-lg text-white text-sm font-medium transition-colors duration-200
                                ${isFormComplete
                                    ? "bg-[#1a6bcc] hover:opacity-90"
                                    : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Registrasi Sekarang
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center mt-6 text-sm">
                        <a href="/login" className="text-blue-600 hover:underline font-medium">
                            Sudah punya akun ?
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}