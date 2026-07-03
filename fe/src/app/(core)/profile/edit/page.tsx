"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

export default function EditProfilePage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({
        fullName: "",
        email: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            setDisplayName(data.displayName || "");
            setFullName(data.name || "");
            setEmail(data.email || "");

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const validateFullName = (value: string) => {

        if (!value.trim()) {
            return "Nama lengkap wajib diisi";
        }

        if (value.length > 30) {
            return "Nama lengkap maksimal 30 karakter";
        }

        const regex = /^[A-Za-z\s]+$/;

        if (!regex.test(value)) {
            return "Nama lengkap hanya boleh huruf dan spasi";
        }

        return "";
    };

    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regex.test(value)) {
            return "Format email tidak valid";
        }

        return "";
    };

    const validatePassword = (value: string) => {
        if (!value) return "";

        const regex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!regex.test(value)) {
            return "Minimal 8 karakter, huruf besar, huruf kecil, angka dan simbol";
        }

        return "";
    };

    const validateConfirmPassword = (
        newPw: string,
        confirmPw: string
    ) => {
        if (!confirmPw) return "";

        if (newPw !== confirmPw) {
            return "Password tidak sesuai";
        }

        return "";
    };

    const validatePasswordFields = () => {

        const hasOldPassword =
            oldPassword.trim() !== "";

        const hasNewPassword =
            newPassword.trim() !== "";

        const hasConfirmPassword =
            confirmPassword.trim() !== "";

        // user mulai ubah password
        const isChangingPassword =
            hasOldPassword ||
            hasNewPassword ||
            hasConfirmPassword;

        if (!isChangingPassword) {
            return true;
        }

        const newErrors = {
            ...errors
        };

        let hasError = false;

        if (!hasOldPassword) {
            newErrors.oldPassword =
                "Kata sandi lama wajib diisi";
            hasError = true;
        }

        if (!hasNewPassword) {
            newErrors.newPassword =
                "Kata sandi baru wajib diisi";
            hasError = true;
        }

        if (!hasConfirmPassword) {
            newErrors.confirmPassword =
                "Konfirmasi password wajib diisi";
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) {
            toast.error(
                "Lengkapi seluruh field password"
            );

            return false;
        }

        return true;
    };

    const hasErrors =
        !!errors.fullName ||
        !!errors.email ||
        !!errors.oldPassword ||
        !!errors.newPassword ||
        !!errors.confirmPassword;

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!validatePasswordFields()) {
                return;
            }
            if (oldPassword) {

                const verifyResponse = await fetch(
                    "http://localhost:5000/api/profile/verify-password",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            oldPassword
                        })
                    }
                );

                const verifyData =
                    await verifyResponse.json();

                if (!verifyResponse.ok) {

                    setErrors(prev => ({
                        ...prev,
                        oldPassword:
                            "Password lama tidak sesuai"
                    }));

                    toast.error(
                        "Password lama tidak sesuai"
                    );

                    return;
                }
            }
            const result = await Swal.fire({
                title: "Simpan perubahan?",
                text: "Perubahan yang disimpan tidak dapat dibatalkan.",
                icon: "warning",
                showCancelButton: true,
                reverseButtons: true,
                confirmButtonText: "Ya, Simpan",
                cancelButtonText: "Batal",
                buttonsStyling: true,
                customClass: {
                    popup: "custom-swal-popup",
                    actions: "custom-swal-actions",
                    confirmButton: "custom-swal-confirm-profile",
                    cancelButton: "custom-swal-cancel",
                },
            });

            if (!result.isConfirmed) {
                return;
            }

            // display name
            await fetch(
                "http://localhost:5000/api/profile/display-name",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        displayName
                    })
                }
            );

            // profile
            const profileResponse = await fetch(
                "http://localhost:5000/api/profile",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: fullName,
                        email,
                        oldPassword,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                if (
                    profileData.error ===
                    "Password lama tidak sesuai"
                ) {
                    setErrors(prev => ({
                        ...prev,
                        oldPassword:
                            "Password lama tidak sesuai"
                    }));

                    toast.error(
                        "Password lama tidak sesuai"
                    );

                    return;
                }

                toast.error(
                    profileData.error ||
                    "Terjadi kesalahan"
                );

                return;
            }

            toast.success(
                "Profil berhasil diperbarui"
            );

            router.replace("/profile");

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background-100 flex">
            {/* Main content */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-12 mt-14 md:mt-0">
                <div className="w-full max-w-2xl bg-card rounded-2xl shadow-sm border border-border px-6 py-10 md:px-12 md:py-12">
                    {/* Page content */}
                    <div className="flex-1 flex flex-col items-center px-4 py-10 sm:px-8">
                        <div className="w-full max-w-xl">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-8">
                                Informasi Pribadi
                            </h1>

                            {/* Personal Info Fields */}
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Nama Tampilan
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Pengguna123"
                                        className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => {

                                            const value = e.target.value;

                                            setFullName(value);

                                            setErrors(prev => ({
                                                ...prev,
                                                fullName: validateFullName(value)
                                            }));
                                        }}
                                        placeholder="Pengguna Contoh"
                                        className={`w-full px-4 py-2.5 bg-background-100 border ${errors.fullName
                                            ? "border-red-500"
                                            : "border-border"
                                            } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition
                                        `}
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {

                                            const value = e.target.value;

                                            setEmail(value);

                                            setErrors(prev => ({
                                                ...prev,
                                                email: validateEmail(value)
                                            }));
                                        }}
                                        placeholder="email@contoh.com"
                                        className={`w-full px-4 py-2.5 bg-background-100 border ${errors.email
                                            ? "border-red-500"
                                            : "border-border"
                                            } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition
                                        `}
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="mb-8">
                                <p className="text-sm text-muted mb-5">Ganti kata sandi anda</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Kata Sandi Lama
                                        </label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => {
                                                setOldPassword(e.target.value);
                                                if (errors.oldPassword) {

                                                    setErrors(prev => ({
                                                        ...prev,
                                                        oldPassword: ""
                                                    }));
                                                }
                                            }}
                                            placeholder="Kata Sandi Lama Anda"
                                            className={`w-full px-4 py-2.5 bg-background-100 border
                                                ${errors.oldPassword
                                                    ? "border-red-500"
                                                    : "border-border"
                                                } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition
                                            `}
                                        />
                                        {errors.oldPassword && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.oldPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Kata Sandi Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {

                                                const value = e.target.value;

                                                setNewPassword(value);

                                                setErrors(prev => ({
                                                    ...prev,
                                                    newPassword: validatePassword(value),
                                                    confirmPassword:
                                                        validateConfirmPassword(
                                                            value,
                                                            confirmPassword
                                                        )
                                                }));
                                            }}
                                            placeholder="Kata Sandi Baru Anda"
                                            className={`w-full px-4 py-2.5 bg-background-100 border ${errors.newPassword
                                                ? "border-red-500"
                                                : "border-border"
                                                } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition
                                        `}
                                        />
                                        {errors.newPassword && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Konfirmasi Kata Sandi Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => {

                                                const value = e.target.value;

                                                setConfirmPassword(value);

                                                setErrors(prev => ({
                                                    ...prev,
                                                    confirmPassword:
                                                        validateConfirmPassword(
                                                            newPassword,
                                                            value
                                                        )
                                                }));
                                            }}
                                            placeholder="Konfirmasi Kata Sandi Baru Anda"
                                            className={`w-full px-4 py-2.5 bg-background-100 border ${errors.confirmPassword
                                                ? "border-red-500"
                                                : "border-border"
                                                } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition
                                        `}
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="px-10 py-2.5 bg-background-500 hover:bg-sidebar-hover active:bg-sidebar-hover border border-border text-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>

                                <button
                                    onClick={handleSave}
                                    disabled={hasErrors}
                                    className={`px-10 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors ${hasErrors
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
                                        }
                                    `}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}