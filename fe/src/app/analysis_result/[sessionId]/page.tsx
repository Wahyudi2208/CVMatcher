"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Lock, ExternalLink, Info, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Candidate = {
    id: number;
    name: string;
    role: string;
    cv: string;
    score: number;
    label: string;
    labelColor: string;
    ringColor: string;
    skills: string[];
};

function CircleScore({ score, color }: { score: number; color: string }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                    <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <span className="relative text-sm font-bold text-gray-800">{score}%</span>
            </div>
        </div>
    );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex justify-between gap-4">
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{candidate.name}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-4 h-4 text-gray-400">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                                <path d="M5 3V2M11 3V2M2 7h12" />
                            </svg>
                        </span>
                        {candidate.role}
                    </span>
                    <span className="hidden sm:inline text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                            <path d="M5.5 6h5M5.5 9h3" />
                        </svg>
                        {candidate.cv}
                    </span>
                </div>
                <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skill Sesuai</p>
                    <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill) => (
                            <span
                                key={skill}
                                className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full border border-gray-200"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end justify-between min-w-[90px]">
                <CircleScore score={candidate.score} color={candidate.ringColor} />
                <span className={`text-xs font-semibold text-right ${candidate.labelColor}`}>{candidate.label}</span>
                <a
                    href="#"
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors mt-12"
                >
                    Lihat Detail
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}

export default function HasilAnalisisPage() {
    const [descExpanded, setDescExpanded] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userName, setUserName] = useState("Tamu");
    const [showReadMore, setShowReadMore] = useState(false);
    const descRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const candidatesPerPage = 6;
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
    const params = useParams();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                const user = localStorage.getItem("user");

                // guest mode
                if (!token || !user) {
                    setIsLoggedIn(false);
                    setUserName("Tamu");
                    return;
                }

                // validasi token ke backend
                const res = await fetch(
                    "http://localhost:5000/api/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // token invalid / user sudah tidak ada
                if (!res.ok) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    setIsLoggedIn(false);
                    setUserName("Tamu");

                    return;
                }

                // token valid
                const parsedUser = JSON.parse(user);

                setIsLoggedIn(true);

                if (parsedUser?.name) {
                    setUserName(parsedUser.name);
                }
            } catch (error) {
                console.error("Auth check failed");

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                setIsLoggedIn(false);
                setUserName("Tamu");
            }
        };

        checkAuth().finally(() => {
            setAuthChecked(true);
        });
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const sessionId = params?.sessionId;

                if (!sessionId) {
                    setError("Session ID tidak ditemukan");
                    return;
                }

                const res = await fetch(
                    `http://localhost:5000/api/upload/results/${sessionId}`
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.error || "Gagal mengambil hasil analisis"
                    );
                }

                const mappedCandidates = data.results.map((result: any) => {
                    const scorePercent = Math.round(result.score * 100);

                    let label = "";
                    let labelColor = "";
                    let ringColor = "";

                    if (scorePercent >= 70) {
                        label = "Sangat Sesuai";
                        labelColor = "text-green-600";
                        ringColor = "#16a34a";
                    } else if (scorePercent >= 50) {
                        label = "Cukup Sesuai";
                        labelColor = "text-yellow-500";
                        ringColor = "#eab308";
                    } else {
                        label = "Kurang Sesuai";
                        labelColor = "text-red-500";
                        ringColor = "#ef4444";
                    }

                    return {
                        id: result.id,
                        name: result.cvFile.fileName.replace(/\.(pdf|docx|doc)$/i, ""),
                        role: "Candidate",
                        cv: result.cvFile.fileName,
                        score: scorePercent,
                        label,
                        labelColor,
                        ringColor,
                        skills: [],
                    };
                });

                setCandidates(mappedCandidates);

            } catch (error: any) {
                console.error(error);

                setError(
                    error.message || "Terjadi kesalahan"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [params]);

    useEffect(() => {
        const savedSidebarState =
            localStorage.getItem("desktopSidebarOpen");

        if (savedSidebarState !== null) {
            setDesktopSidebarOpen(
                JSON.parse(savedSidebarState)
            );
        }
    }, []);

    useEffect(() => {
        const checkOverflow = () => {
            if (descRef.current) {
                setShowReadMore(
                    descRef.current.scrollHeight > descRef.current.clientHeight
                );
            }
        };

        checkOverflow();

        window.addEventListener("resize", checkOverflow);

        return () => {
            window.removeEventListener("resize", checkOverflow);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "desktopSidebarOpen",
            JSON.stringify(desktopSidebarOpen)
        );
    }, [desktopSidebarOpen]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-sm">
                    Memuat hasil analisis...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-red-500 text-sm">
                    {error}
                </p>
            </div>
        );
    }

    const totalPages = Math.ceil(candidates.length / candidatesPerPage);
    const startIndex = (currentPage - 1) * candidatesPerPage;
    const currentCandidates = candidates.slice(
        startIndex,
        startIndex + candidatesPerPage
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Banner - Guest Only */}
            {authChecked && !isLoggedIn && showBanner && (
                <div className="bg-teal-600 text-white px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                            <a href="/login" className="underline font-medium">
                                Masuk
                            </a>{" "}
                            untuk mendapatkan hasil ranking otomatis, filter kandidat, dan ekspor laporan.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowBanner(false)}
                        className="text-white hover:text-teal-200 flex-shrink-0 ml-4"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <div className="flex items-center gap-2">
                    <Image
                        src="/img/logo-website.png"
                        alt="CVMatcher Logo"
                        width={24}
                        height={24}
                    />

                    <span className="font-bold text-base">
                        <span className="text-blue-800">CV</span>
                        <span className="text-gray-900">Matcher</span>
                    </span>
                </div>

                <div className="w-10" />
            </div>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`
                        fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col py-4
                        ${desktopSidebarOpen
                            ? "md:w-60" : "md:w-[72px]"} ${mobileSidebarOpen
                                ? "translate-x-0" : "-translate-x-full"} 
                        md:translate-x-0 w-64
                    `}
                >

                    {/* Mobile Close Button */}
                    <div className="md:hidden flex justify-end mb-2">
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>

                    {/* Logo / Toggle */}
                    <div className="px-3 mb-4">
                        <div className="group relative flex items-center">
                            <Link
                                href="/landing_page"
                                className={`
                                    flex items-center rounded-xl hover:bg-gray-100 transition-all 
                                    ${desktopSidebarOpen
                                        ? "gap-2 px-2 py-2 w-full" : "justify-center w-full py-2"}
                                `}
                            >
                                <Image
                                    src="/img/logo-website.png"
                                    alt="CVMatcher Logo"
                                    width={28}
                                    height={28}
                                    className="rounded-md shrink-0"
                                />

                                {desktopSidebarOpen && (
                                    <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                                        <span className="text-blue-800">CV</span>
                                        <span className="text-gray-900">Matcher</span>
                                    </span>
                                )}
                            </Link>

                            {/* Close/Open Button Desktop */}
                            <button
                                onClick={() =>
                                    setDesktopSidebarOpen(!desktopSidebarOpen)
                                }
                                className={`
                                    hidden md:flex items-center justify-center absolute right-2 w-7 h-7 rounded-lg bg-white
                                    border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100
                                `}
                            >
                                {desktopSidebarOpen ? (
                                    <X className="w-4 h-4 text-gray-700" />
                                ) : (
                                    <Menu className="w-4 h-4 text-gray-700" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-1 px-3">
                        <a
                            href="../upload_page"
                            className={`
                                flex items-center rounded-lg text-sm font-medium hover:bg-gray-100 transition-all
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                                text-gray-600
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {desktopSidebarOpen && "Unggah CV"}
                        </a>
                        <a
                            href="#"
                            className={`
                                flex items-center rounded-lg text-sm font-medium transition-all bg-teal-600 text-white
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                                `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {desktopSidebarOpen && "Hasil Analisis"}
                        </a>
                    </nav>

                    {/* Bottom Nav */}
                    <div className="mt-auto space-y-1">
                        <a
                            href="#"
                            className={`
                                flex items-center rounded-lg text-sm font-medium hover:bg-gray-100 transition-all
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                                text-gray-600
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {desktopSidebarOpen && "Profil"}
                        </a>
                        <a
                            href="#"
                            className={`
                                flex items-center rounded-lg text-sm font-medium hover:bg-gray-100 transition-all
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                                text-gray-600
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {desktopSidebarOpen && "Pengaturan"}
                        </a>

                        {/* User */}
                        <div
                            className={`
                                flex items-center mt-2 px-3
                                ${desktopSidebarOpen
                                    ? "gap-3 py-2.5" : "justify-center py-3"}
                            `}
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {isLoggedIn ? userName.charAt(0).toUpperCase() : "G"}
                            </div>

                            {desktopSidebarOpen && (
                                <span className="text-sm text-gray-700 font-medium">
                                    {isLoggedIn ? userName : "Tamu"}
                                </span>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Mobile Overlay */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main
                    className={`
                        flex-1 px-4 sm:px-6 lg:px-10 xl:px-12 py-6 w-full max-w-[1600px] transition-all duration-300 md:ml-[72px] 
                        ${desktopSidebarOpen ? "lg:ml-[240px]" : "lg:ml-[72px]"}
                    `}
                >
                    {/* Header */}
                    <div className="mb-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hasil Analisis</h1>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                                <path d="M5 3V2M11 3V2M2 7h12" />
                            </svg>
                            Senior Frontend Developer — PT Teknologi Maju
                        </div>
                    </div>

                    {/* Job Description Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3">
                            Deskripsi Pekerjaan
                        </h2>

                        <div
                            ref={descRef}
                            className={`relative overflow-hidden transition-all duration-300 ${descExpanded ? "max-h-[500px]" : "max-h-[130px]"}`}
                        >
                            <div className="text-sm text-gray-700 space-y-2 pr-2">
                                <p>
                                    <span className="font-medium">Posisi :</span>
                                    <br />
                                    Fullstack Developer
                                </p>

                                <p className="text-gray-500">
                                    <span className="font-medium text-gray-700">
                                        Kebutuhan :
                                    </span>
                                    <br />
                                    1. Dapat menggunakan framework laravel
                                    <br />
                                    2. Menguasai REST API
                                    <br />
                                    3. Mengerti MySQL
                                    <br />
                                    4. Familiar dengan Git
                                    <br />
                                    5. Memahami deployment server
                                    <br />
                                    6. Memiliki komunikasi yang baik
                                    <br />
                                    7. Bersedia bekerja onsite
                                </p>
                            </div>

                            {!descExpanded && showReadMore && (
                                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            )}
                        </div>

                        {showReadMore && (
                            <div className="flex justify-end mt-3">
                                <button
                                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                    onClick={() => setDescExpanded(!descExpanded)}
                                >
                                    {descExpanded ? "Tampilkan Lebih Sedikit" : "Selengkapnya"}

                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${descExpanded ? "rotate-180" : ""}`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Total Kandidat</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {candidates.length}
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Rata-rata Skor</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {candidates.length > 0
                                    ? Math.round(
                                        candidates.reduce(
                                            (acc, curr) => acc + curr.score,
                                            0
                                        ) / candidates.length
                                    )
                                    : 0}%
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Sangat Sesuai</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {
                                    candidates.filter(
                                        (c) => c.score >= 70
                                    ).length
                                }
                                <span className="text-sm font-normal text-gray-400">kandidat</span>
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Cukup Sesuai</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 50 &&
                                            c.score < 70
                                    ).length
                                }
                                <span className="text-sm font-normal text-gray-400">kandidat</span>
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 sm:col-span-1">
                            <p className="text-xs text-gray-500">Kurang Sesuai</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">
                                {
                                    candidates.filter(
                                        (c) => c.score < 50
                                    ).length
                                }
                                <span className="text-sm font-normal text-gray-400">kandidat</span>
                            </p>
                        </div>
                    </div>

                    {/* Filter Row (locked) */}
                    <div className="relative mb-4">
                        <div className="flex items-center justify-between gap-3 blur-sm pointer-events-none select-none" aria-hidden="true">
                            <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                            <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                                <Lock className="w-4 h-4" />
                                Login untuk menggunakan filter
                            </button>
                        </div>
                    </div>

                    {/* Candidate Count */}
                    <p className="text-sm text-gray-500 mb-3">
                        Menampilkan{" "}
                        <span className="font-semibold text-gray-700">
                            {currentCandidates.length}
                        </span>{" "}
                        dari {candidates.length} kandidat
                    </p>

                    {/* Candidate Cards */}
                    <div className="flex flex-col gap-4">
                        {currentCandidates.map((c) => (
                            <CandidateCard key={c.id} candidate={c} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ‹
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => {
                            const page = i + 1;

                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${currentPage === page
                                        ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"}
                                    `}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                )
                            }
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ›
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}