"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

type Language = "Indonesia" | "English";

interface SettingsState {
    language: Language;
}

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<SettingsState>({
        language: "Indonesia",
    });

    const [showConfirm, setShowConfirm] = useState<string | null>(null);

    const handleAction = (action: string) => {
        setShowConfirm(action);
    };

    const handleConfirm = () => {

        if (showConfirm === "logout") {

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("currentSessionId");

            router.push("/landing_page");

            return;
        }

        console.log(`Action confirmed: ${showConfirm}`);

        setShowConfirm(null);
    };

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
                            <div className="flex items-center justify-between px-6 py-4">
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
                            </div>

                            {/* Theme */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Tema</span>
                                <div className="relative">
                                    <select
                                        value={theme}
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
                            {/* Clear app cache */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Hapus cache aplikasi</span>
                                <button
                                    onClick={() => handleAction("clear-cache")}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Hapus
                                </button>
                            </div>

                            {/* Clear local data */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Hapus data lokal</span>
                                <button
                                    onClick={() => handleAction("clear-local")}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Hapus
                                </button>
                            </div>

                            {/* Delete all analysis */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Hapus semua analisis</span>
                                <button
                                    onClick={() => handleAction("delete-analysis")}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Account Section */}
                    <section>
                        <p className="text-sm text-muted mt-3 mb-3">Account</p>
                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Keluar dari akun anda</span>
                                <button
                                    onClick={() => handleAction("logout")}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Keluar
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Hapus akun Anda</span>
                                <button
                                    onClick={() => handleAction("delete-account")}
                                    className="border border-red-500 text-red-500 font-semibold text-sm px-5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            {showConfirm === "logout"
                                ? "Keluar Akun"
                                : "Konfirmasi"}
                        </h2>
                        <p className="text-sm text-muted mb-6">
                            {showConfirm === "logout"
                                ? "Anda akan keluar dari akun ini dan kembali ke mode tamu."
                                : "Apakah Anda yakin ingin melanjutkan tindakan ini? Tindakan ini tidak dapat dibatalkan."}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-black font-semibold hover:bg-red-600 transition-colors"
                            >
                                {showConfirm === "logout"
                                    ? "Keluar"
                                    : "Konfirmasi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}