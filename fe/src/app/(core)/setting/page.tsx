"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";

type Language = "Indonesia" | "English";

interface SettingsState {
    language: Language;
}

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [settings, setSettings] = useState<SettingsState>({
        language: "Indonesia",
    });

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Keluar Akun?",
            text: "Anda akan keluar dari akun ini dan kembali ke mode tamu.",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: "Keluar",
            cancelButtonText: "Batal",
            customClass: {
                popup: "custom-swal-popup",
                actions: "custom-swal-actions",
                confirmButton: "custom-swal-confirm-logout",
                cancelButton: "custom-swal-cancel",
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("currentSessionId");
        localStorage.setItem(
            "logout-event",
            Date.now().toString()
        );
        sessionStorage.clear();

        window.location.replace("/landing_page");
    };

    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Hapus Akun?",
            text: "Akun dan seluruh riwayat analisis Anda akan dihapus permanen !",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: "Hapus Akun",
            cancelButtonText: "Batal",
            customClass: {
                popup: "custom-swal-popup",
                actions: "custom-swal-actions",
                confirmButton: "custom-swal-confirm",
                cancelButton: "custom-swal-cancel",
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    "http://localhost:5000/api/user/delete",
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message
                );
            }

            await Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Akun berhasil dihapus.",
                customClass: {
                    popup: "custom-swal-popup",
                    confirmButton: "custom-swal-confirm-delete",
                },
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("currentSessionId");

            router.replace("/landing_page");

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Gagal menghapus akun.",
                customClass: {
                    popup: "custom-swal-popup",
                    confirmButton: "custom-swal-confirm",
                },
            });
        }
    };

    const handleClearLocalData = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Hapus Data Lokal?",
            text: "Seluruh data lokal pada browser ini akan dihapus.",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
            customClass: {
                popup: "custom-swal-popup",
                actions: "custom-swal-actions",
                confirmButton: "custom-swal-confirm",
                cancelButton: "custom-swal-cancel",
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        // Data analisis guest
        localStorage.removeItem("currentSessionId");
        localStorage.removeItem("guestId");

        // Preferensi UI sementara
        localStorage.removeItem("desktopSidebarOpen");

        // Bersihkan session storage
        sessionStorage.clear();

        await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data lokal berhasil dihapus.",
            customClass: {
                popup: "custom-swal-popup",
                confirmButton: "custom-swal-confirm-delete",
            },
        });

        window.location.reload();
    };

    const handleDeleteAllAnalysis = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Hapus Semua Analisis?",
            text: "Seluruh riwayat analisis akan dihapus permanen.",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
            customClass: {
                popup: "custom-swal-popup",
                actions: "custom-swal-actions",
                confirmButton: "custom-swal-confirm",
                cancelButton: "custom-swal-cancel",
            },
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response =
                await fetch(
                    "http://localhost:5000/api/upload/history",
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error
                );
            }

            await Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Seluruh riwayat analisis berhasil dihapus.",
                customClass: {
                    popup: "custom-swal-popup",
                    confirmButton:
                        "custom-swal-confirm-delete",
                },
            });

            localStorage.removeItem(
                "currentSessionId"
            );

            window.location.reload();

        }
        catch (error) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Gagal menghapus seluruh riwayat analisis.",
                customClass: {
                    popup: "custom-swal-popup",
                    confirmButton:
                        "custom-swal-confirm",
                },
            });
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-8 md:px-16 lg:px-24">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-semibold text-foreground text-center mb-10">
                    Pengaturan
                </h1>

                <div className="space-y-8">
                    {/* General Section */}
                    <section>
                        <p className="text-sm text-muted mb-3">General</p>
                        <div className="bg-card rounded-xl shadow-sm border border-border divide-y divide-border">
                            {/* Language */}
                            {/* <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Bahasa</span>
                                <div className="relative">
                                    <select
                                        value={settings.language}
                                        onChange={(e) =>
                                            setSettings((s) => ({
                                                ...s,
                                                language: e.target.value as Language,
                                            }))
                                        }
                                        className="appearance-none border border-border rounded-lg px-4 py-2 pr-8 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option className="cursor-pointer" value="Indonesia">Indonesia</option>
                                        <option className="cursor-pointer" value="English">English</option>
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted">
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div> */}

                            {/* Theme */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Tema</span>
                                <div className="relative">
                                    <select
                                        value={
                                            theme === "system"
                                                ? "system"
                                                : resolvedTheme
                                        }
                                        onChange={(e) =>
                                            setTheme(e.target.value)
                                        }
                                        className="appearance-none border border-border rounded-lg px-4 py-2 pr-8 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="light">Terang</option>
                                        <option value="dark">Gelap</option>
                                        <option value="system">Sistem</option>
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Data Section */}
                    <section>
                        <p className="text-sm text-muted mt-3 mb-3">Data</p>
                        <div className="bg-card rounded-xl shadow-sm border border-border divide-y divide-border">
                            {/* Clear local data */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Hapus data lokal</span>
                                <button
                                    onClick={handleClearLocalData}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </div>

                            {/* Delete all analysis */}
                            {isLoggedIn && (
                                <div className="flex items-center justify-between px-6 py-4">
                                    <span className="text-sm text-foreground">Hapus semua analisis</span>
                                    <button
                                        onClick={handleDeleteAllAnalysis}
                                        className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Account Section */}
                    {isLoggedIn && (
                        <section>
                            <p className="text-sm text-muted mt-3 mb-3">Account</p>
                            <div className="bg-card rounded-xl shadow-sm border border-border">
                                <div className="flex items-center justify-between px-6 py-4">
                                    <span className="text-sm text-foreground">Keluar dari akun anda</span>
                                    <button
                                        onClick={handleLogout}
                                        className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                                    >
                                        Keluar
                                    </button>
                                </div>
                                <div className="flex items-center justify-between px-6 py-4">
                                    <span className="text-sm text-foreground">Hapus akun Anda</span>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}