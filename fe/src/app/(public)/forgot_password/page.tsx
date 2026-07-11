"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [otp, setOtp] = useState(["", "", "", "", "", "",]);
    const [countdown, setCountdown] = useState(120);
    const [otpExpired, setOtpExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!form.email.trim()) {
            newErrors.email = "Email wajib diisi.";
        }

        if (!form.password) {
            newErrors.password = "Kata sandi wajib diisi.";
        }

        return newErrors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const EyeIcon = ({ show }: { show: boolean }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    const CVMatcherLogo = () => (
        <div className="flex items-center gap-2">
            <Image src="/img/logo-website.png" alt="CVMatcher Logo" width={90} height={90} className="rounded-md" />
            <span className="font-bold text-5xl tracking-tight">
                <span className="text-blue-800">CV</span>
                <span className="text-gray-900">Matcher</span>
            </span>
        </div>
    );

    useEffect(() => {
        if (step !== 2) return;
        if (countdown <= 0) {
            setOtpExpired(true);
            return;
        }
        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [step, countdown]);

    const handleOtpChange = (
        value: string,
        index: number
    ) => {
        // Hanya boleh angka
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Otomatis pindah ke kotak berikutnya
        if (value && index < otp.length - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number
    ) => {
        if (
            e.key === "Backspace" &&
            otp[index] === "" &&
            index > 0
        ) {
            otpInputRefs.current[index - 1]?.focus();
        }
        if (
            e.key === "Enter"
        ) {
            e.preventDefault();
            handleVerifyOTP();
        }
    };

    const handleOtpPaste = (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData("text")
            .trim();

        // Hanya boleh 6 digit angka
        if (!/^\d{6}$/.test(pastedData)) {
            return;
        }

        const values = pastedData.split("");
        setOtp(values);

        values.forEach((value, index) => {
            if (otpInputRefs.current[index]) {
                otpInputRefs.current[index]!.value = value;
            }
        });

        otpInputRefs.current[values.length - 1]?.focus();
    };

    const formatCountdown = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const handleResendOTP = async () => {
        if (!otpExpired) return;
        try {
            setIsLoading(true);
            setLoadingMessage(
                "Mengirim ulang kode OTP..."
            );

            const res = await fetch(

                "http://localhost:5000/api/auth/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: form.email,
                    }),
                }
            );
            const data =
                await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Gagal mengirim ulang OTP."
                );
            }
            setOtp(["", "", "", "", "", ""]);
            setCountdown(120);
            setOtpExpired(false);
            toast.success(
                "Kode OTP baru telah dikirim."
            );
            otpInputRefs.current[0]?.focus();
        }

        catch (error: any) {
            toast.error(
                error.message ||
                "Terjadi kesalahan."
            );
        }

        finally {
            setIsLoading(false);
        }
    };

    const passwordRules = {
        minLength: form.password.length >= 8,
        uppercase: /[A-Z]/.test(form.password),
        lowercase: /[a-z]/.test(form.password),
        number: /\d/.test(form.password),
        special: /[_!@#$%^&*(),.?":{}|<>-]/.test(form.password),
    };

    const RuleItem = ({
        passed,
        text,
    }: {
        passed: boolean;
        text: string;
    }) => (
        <div
            className={`
                flex items-center gap-2 text-xs
                ${passed
                    ? "text-green-600"
                    : "text-gray-400"
                }
            `}>
            <span>
                {passed ? "✓" : "○"}
            </span>
            <span>
                {text}
            </span>
        </div>
    );

    const maskEmail = (email: string) => {
        if (!email.includes("@")) return email;
        const [name, domain] = email.split("@");
        const visible = name.slice(0, 3);
        const masked = "*".repeat(
            Math.max(name.length - 3, 2)
        );

        return `${visible}${masked}@${domain}`;
    };

    const handleSendOTP = async () => {
        const validationErrors = validate();
        if (validationErrors.email) {

            setErrors(validationErrors);
            return;
        }

        try {
            setIsLoading(true);
            setLoadingMessage(
                "Mengirim kode OTP..."
            );

            const res = await fetch(

                "http://localhost:5000/api/auth/forgot-password",

                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: form.email,
                    }),
                }
            );

            const data =
                await res.json();
            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Gagal mengirim OTP."
                );
            }

            toast.success(
                "Kode OTP berhasil dikirim."
            );

            setCountdown(120);
            setOtpExpired(false);
            setStep(2);
        }

        catch (error: any) {
            toast.error(
                error.message ||
                "Terjadi kesalahan."
            );
        }

        finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            toast.error("Masukkan 6 digit kode OTP.");
            return;
        }

        try {
            setIsLoading(true);
            setLoadingMessage(
                "Memverifikasi kode OTP..."
            );
            const res = await fetch(
                "http://localhost:5000/api/auth/verify-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: form.email,
                        otp: otpCode,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Verifikasi OTP gagal."
                );
            }

            toast.success(
                "OTP berhasil diverifikasi."
            );
            setStep(3);
        }

        catch (error: any) {
            if (
                error.message.includes("kedaluwarsa")
            ) {
                setOtp([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]);

                setOtpExpired(true);
            }
            toast.error(
                error.message ||
                "Terjadi kesalahan."
            );
        }

        finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!form.password) {
            toast.error("Password baru wajib diisi.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            toast.error("Konfirmasi password tidak sesuai.");
            return;
        }

        try {
            setIsLoading(true);
            setLoadingMessage(
                "Menyimpan kata sandi..."
            );
            const res = await fetch(
                "http://localhost:5000/api/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: form.email,
                        password: form.password,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Gagal mengubah password."
                );
            }
            
            router.push(
                "/login?success=reset-password"
            );
        }

        catch (error: any) {
            toast.error(
                error.message ||
                "Terjadi kesalahan."
            );
        }

        finally {
            setIsLoading(false);
        }
    };

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
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                        {step === 1 && "Lupa Kata Sandi"}
                        {step === 2 && "Verifikasi OTP"}
                        {step === 3 && "Atur Ulang Kata Sandi"}
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">
                        {step === 1 &&
                            "Masukkan email Anda untuk menerima kode OTP dan mengatur ulang kata sandi Anda."}
                        {step === 2 &&
                            "Masukkan 6 digit kode OTP yang telah dikirim ke email Anda."}
                        {step === 3 &&
                            "Masukkan kata sandi baru untuk akun Anda."}
                    </p>
                    <div className="mb-8">
                        <div className="flex items-center">

                            {/* STEP 1 */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                        ${step > 1
                                            ? "bg-green-500 text-white"
                                            : step === 1
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }
                                    `}
                                >
                                    {step > 1 ? (
                                        <CheckIcon />
                                    ) : (
                                        "1"
                                    )}
                                </div>
                                <span className="mt-2 text-xs font-medium text-gray-600">
                                    Email
                                </span>
                            </div>
                            <div
                                className={`
                                    flex-1 h-[2px] mx-2
                                    ${step >= 2
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                    }
                                 `} />

                            {/* STEP 2 */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                                        ${step > 2
                                            ? "bg-green-500 text-white"
                                            : step === 2
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }
                                    `}
                                >
                                    {step > 2 ? (
                                        <CheckIcon />
                                    ) : (
                                        "2"
                                    )}
                                </div>
                                <span className="mt-2 text-xs font-medium text-gray-600">
                                    OTP
                                </span>
                            </div>
                            <div
                                className={`
                                    flex-1 h-[2px] mx-2 ${step >= 3
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                    }
                                `}
                            />

                            {/* STEP 3 */}
                            <div className="flex flex-col items-center">

                                <div
                                    className={`
                                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold 
                                        ${step === 3
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-500"
                                        }
                                    `}
                                >
                                    3
                                </div>
                                <span className="mt-2 text-xs font-medium text-gray-600">
                                    Password
                                </span>
                            </div>
                        </div>
                    </div>

                    {step === 1 && (
                        <form
                            noValidate
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendOTP();
                            }}
                        >
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
                                    className={`
                                        w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition 
                                        focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                                        ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`
                                    } />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg text-white font-semibold text-sm tracking-wide transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
                                style={{ backgroundColor: "#1056a8" }}
                            >
                                Kirim Kode OTP
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="space-y-6">
                            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                                <p className="text-sm text-blue-700">
                                    Kode OTP telah dikirim ke
                                </p>
                                <p className="mt-1 font-semibold text-blue-900">
                                    {maskEmail(form.email)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Kode OTP
                                </label>
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                otpInputRefs.current[index] = el;
                                            }}
                                            type="text"
                                            pattern="\d*"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) =>
                                                handleOtpChange(
                                                    e.target.value,
                                                    index
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                handleOtpKeyDown(
                                                    e,
                                                    index
                                                )
                                            }
                                            onPaste={handleOtpPaste}
                                            enterKeyHint="done"
                                            autoComplete="one-time-code"
                                            className="w-12 h-12 rounded-lg border border-gray-300 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Kode OTP akan kedaluwarsa dalam
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-800 tracking-wider">
                                        {formatCountdown(countdown)}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Belum menerima kode?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={!otpExpired}
                                        className={`
                                            mt-1 text-sm font-semibold transition
                                            ${otpExpired
                                                ? "text-blue-600 hover:underline cursor-pointer"
                                                : "text-gray-400 cursor-not-allowed"
                                            }
                                        `}
                                    >
                                        Kirim Ulang Kode OTP
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleVerifyOTP}
                                className="w-full py-3 rounded-lg text-white font-semibold text-sm cursor-pointer"
                                style={{
                                    backgroundColor: "#1056a8",
                                }}
                            >
                                Verifikasi OTP
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleResetPassword();
                            }}
                        >
                            {/* Password Baru */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-800 mb-1.5"
                                >
                                    Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Masukkan kata sandi baru"
                                        value={form.password}
                                        onChange={handleChange}
                                        className={`
                                            w-full px-4 py-2.5 pr-11 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.password
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-300 bg-white"
                                            }
                                        `}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        <EyeIcon show={showPassword} />
                                    </button>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <RuleItem
                                        passed={passwordRules.minLength}
                                        text="Minimal 8 karakter"
                                    />
                                    <RuleItem
                                        passed={passwordRules.uppercase}
                                        text="Mengandung huruf besar"
                                    />
                                    <RuleItem
                                        passed={passwordRules.lowercase}
                                        text="Mengandung huruf kecil"
                                    />
                                    <RuleItem
                                        passed={passwordRules.number}
                                        text="Mengandung angka"
                                    />
                                    <RuleItem
                                        passed={passwordRules.special}
                                        text="Mengandung karakter spesial"
                                    />

                                </div>

                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Konfirmasi Password */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-800 mb-1.5"
                                >
                                    Konfirmasi Kata Sandi
                                </label>

                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Konfirmasi kata sandi"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        <EyeIcon show={showPassword} />
                                    </button>
                                </div>
                                {form.confirmPassword && (
                                    <p
                                        className={`
                                            mt-2 text-xs
                                            ${form.password === form.confirmPassword
                                                ? "text-green-600"
                                                : "text-red-500"
                                            }
                                        `}
                                    >
                                        {
                                            form.password === form.confirmPassword
                                                ? "Kata sandi cocok."
                                                : "Kata sandi tidak cocok."
                                        }
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg text-white font-semibold text-sm tracking-wide transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
                                style={{
                                    backgroundColor: "#1056a8",
                                }}
                            >
                                Simpan Kata Sandi
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm flex items-center justify-center">
                    <div
                        className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl p-8">
                        <div className="flex flex-col items-center text-center">
                            <LoaderCircle
                                className="w-14 h-14 text-teal-600 animate-spin" />
                            <h2
                                className="mt-6 text-xl font-bold text-gray-900">
                                {loadingMessage}
                            </h2>
                            <p
                                className="mt-3 text-sm leading-6 text-gray-500">
                                Mohon tunggu sebentar.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}