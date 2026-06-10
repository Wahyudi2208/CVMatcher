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

function getTier(score: number) {
    if (score >= 85 && score <= 100) {
        return {
            label: "Sangat Sesuai",
            labelColor: "text-green-600",
            ringColor: "#16a34a",
        };
    }

    if (score >= 70 && score < 85) {
        return {
            label: "Cukup Sesuai",
            labelColor: "text-yellow-500",
            ringColor: "#eab308",
        };
    }

    if (score >= 50 && score < 70) {
        return {
            label: "Kurang Sesuai",
            labelColor: "text-red-400",
            ringColor: "#f87171",
        };
    }

    return {
        label: "Tidak Sesuai",
        labelColor: "text-red-600",
        ringColor: "#dc2626",
    };
}

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
                <span className="relative text-sm font-bold text-gray-800">
                    {score.toFixed(2)}%
                </span>
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

                    const scorePercent = Number(result.score);

                    const tier = getTier(scorePercent);

                    return {
                        id: result.id,

                        name: result.cvFile.fileName.replace(
                            /\.(pdf|docx|doc)$/i,
                            ""
                        ),

                        role: "Candidate",

                        cv: result.cvFile.fileName,

                        score: scorePercent,

                        label: tier.label,

                        labelColor: tier.labelColor,

                        ringColor: tier.ringColor,

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

            <div className="flex flex-1">

                {/* Main Content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {/* Header */}
                    <div className="mb-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hasil Analisis</h1>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                                <path d="M5 3V2M11 3V2M2 7h12" />
                            </svg>
                            {`Session #${params.sessionId}`}
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
                                {
                                    candidates.length > 0
                                        ? (
                                            candidates.reduce(
                                                (acc, curr) => acc + curr.score,
                                                0
                                            ) / candidates.length
                                        ).toFixed(2)
                                        : "0.00"
                                }%
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Sangat Sesuai</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 85 &&
                                            c.score <= 100
                                    ).length
                                }
                                <span className="text-sm font-normal text-gray-400">kandidat</span>
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Cukup Sesuai</p>
                            <p className="text-2xl font-bold text-yellow-500 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 70 &&
                                            c.score < 85
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
                                        (c) =>
                                            c.score >= 50 &&
                                            c.score < 70
                                    ).length
                                }
                                <span className="text-sm font-normal text-gray-400">kandidat</span>
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500">
                                Tidak Sesuai
                            </p>

                            <p className="text-2xl font-bold text-red-600 mt-1">
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