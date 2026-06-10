"use client";

import Link from "next/link";
import { useState } from "react";

const analysisData = {
    id: "1",
    candidateName: "Sari Dewi Kusuma",
    cvFileName: "CV_Sari_Dewi.pdf",
    matchScore: 74,
    matchLabel: "Sangat Sesuai",
    skillsMatched: ["Vue.js", "JavaScript", "REST API", "MySQL"],
    skillsNotMatched: ["Vue.js", "JavaScript", "REST API", "MySQL"],
    cvContent: `Sari Dewi Kusuma adalah seorang Frontend Developer dengan pengalaman 3 tahun dalam pengembangan aplikasi web. Menguasai Vue.js, JavaScript, dan REST API integration. Berpengalaman bekerja di lingkungan Agile dan mampu berkolaborasi dengan tim backend menggunakan MySQL sebagai database utama.

Pendidikan: S1 Teknik Informatika, Universitas Indonesia (2018–2022).

Pengalaman: Frontend Developer di PT. Digital Solusi (2022–sekarang), membangun dashboard internal dan antarmuka pengguna untuk klien enterprise.

Keterampilan tambahan: Git, Figma, unit testing dengan Jest.`,
    summaryRecommendation: `Kandidat sangat direkomendasikan untuk posisi Frontend Developer. Sari memiliki kecocokan skill yang tinggi dengan kebutuhan tim, terutama pada Vue.js dan integrasi REST API.

Kekuatan utama: pengalaman nyata di proyek enterprise dan kemampuan komunikasi lintas tim yang baik.

Saran: Perlu pendalaman lebih lanjut pada beberapa teknologi backend seperti Node.js dan pengalaman dengan sistem CI/CD. Namun secara keseluruhan, kandidat ini layak untuk dilanjutkan ke tahap wawancara teknis.`,
};

const navItems = [
    {
        label: "Upload CV",
        href: "/dashboard/upload",
        icon: (
            <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
            </svg>
        ),
        active: false,
    },
    {
        label: "Hasil Analisis",
        href: "/dashboard/result",
        icon: (
            <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
        active: true,
    },
];

function ScoreCircle({
    score,
    label,
}: {
    score: number;
    label: string;
}) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-24 h-24">
                <svg
                    className="w-24 h-24 -rotate-90"
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">{score}%</span>
                </div>
            </div>
            <span className="text-sm font-semibold text-emerald-600">{label}</span>
        </div>
    );
}

function SkillBadge({
    skill,
    variant,
}: {
    skill: string;
    variant: "matched" | "unmatched";
}) {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${variant === "matched"
                    ? "border-emerald-500 text-emerald-600 bg-white"
                    : "border-red-400 text-red-500 bg-white"
                }`}
        >
            {skill}
        </span>
    );
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`
          fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-100 z-30 flex flex-col
          transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:flex
        `}
            >
                <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-900 text-base tracking-tight">
                        CV<span className="text-blue-600">Matcher</span>
                    </span>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-gray-100 px-3 py-4 space-y-1">
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pengaturan
                    </Link>

                    <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
                        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                            G
                        </div>
                        <span className="text-sm font-medium text-gray-700">Guest</span>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default function AnalysisDetailPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const data = analysisData;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-gray-900">
                        CV<span className="text-blue-600">Matcher</span>
                    </span>
                </header>

                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-gray-100">
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                        {data.candidateName}
                                    </h1>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <svg
                                            className="w-3.5 h-3.5 text-gray-400 shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="text-sm text-gray-500 truncate">{data.cvFileName}</span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <ScoreCircle score={data.matchScore} label={data.matchLabel} />
                                </div>
                            </div>

                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                                    Skill Sesuai
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skillsMatched.map((skill) => (
                                        <SkillBadge key={skill} skill={skill} variant="matched" />
                                    ))}
                                </div>
                            </div>

                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                                    Skill Tidak Sesuai
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skillsNotMatched.map((skill) => (
                                        <SkillBadge key={skill} skill={skill} variant="unmatched" />
                                    ))}
                                </div>
                            </div>

                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                                    Isi File CV
                                </h2>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {data.cvContent}
                                </p>
                            </div>

                            <div className="px-6 py-5">
                                <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                                    Summary Recommendation
                                </h2>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {data.summaryRecommendation}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}