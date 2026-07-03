"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Lock, ExternalLink, Info, FileText, SlidersHorizontal, ArrowUpDown, } from "lucide-react";
import Link from "next/link";

type Candidate = {
    id: number;
    name: string;
    role: string;
    cv: string;
    score: number;
    label: string;
    reasoning: string;
    matchedSkills: string[];
    unmatchedSkills: string[];
    labelColor: string;
    ringColor: string;
};

function getTier(score: number) {

    if (score >= 85) {
        return {
            label: "Sangat Sesuai",
            labelColor: "text-green-600",
            ringColor: "#16a34a",
        };
    }

    if (score >= 70) {
        return {
            label: "Cukup Sesuai",
            labelColor: "text-yellow-500",
            ringColor: "#eab308",
        };
    }

    if (score >= 55) {
        return {
            label: "Kurang Sesuai",
            labelColor: "text-orange-500",
            ringColor: "#f97316",
        };
    }

    return {
        label: "Tidak Sesuai",
        labelColor: "text-red-600",
        ringColor: "#dc2626",
    };
}

// function getAILabelStyle(label: string) {

//     if (label === "Strong Match") {
//         return {
//             labelColor: "text-green-600",
//             ringColor: "#16a34a",
//         };
//     }

//     if (label === "Potential Match") {
//         return {
//             labelColor: "text-yellow-500",
//             ringColor: "#eab308",
//         };
//     }

//     return {
//         labelColor: "text-red-600",
//         ringColor: "#dc2626",
//     };
// }

function CircleScore({ score, color }: { score: number; color: string }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" className="text-border" strokeWidth="5" strokeLinecap="round" />
                    <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                </svg>
                <span className="relative text-sm font-bold text-foreground">
                    {score.toFixed(2)}%
                </span>
            </div>
        </div>
    );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex justify-between gap-4">
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">{candidate.name}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1 text-sm text-muted">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                            <path d="M5.5 6h5M5.5 9h3" />
                        </svg>
                        {candidate.cv}
                    </span>
                </div>
                <div className="mt-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                        Skill Sesuai
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {candidate.matchedSkills.length > 0 ? (
                            <>
                                {candidate.matchedSkills.slice(0, 5).map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-4 py-2 text-sm font-medium rounded-full bg-green-200 text-green-800 dark:bg-green-950 dark:text-green-400 border">
                                        {skill}
                                    </span>
                                ))}

                                {candidate.matchedSkills.length > 5 && (
                                    <span className="text-sm text-muted-foreground self-center">
                                        +{candidate.matchedSkills.length - 5} lainnya
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-sm text-muted">
                                Tidak ada skill yang sesuai
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end justify-between min-w-[90px]">
                <CircleScore score={candidate.score} color={candidate.ringColor} />
                <span className={`text-xs font-semibold text-right ${candidate.labelColor}`}>{candidate.label}</span>
                <Link href={`/detail/${candidate.id}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors mt-12">
                    Lihat Rincian
                    <ExternalLink className="w-3 h-3" />
                </Link>
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
    const sessionId =
        params.sessionId as string;
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [jobDescriptionText, setJobDescriptionText] = useState("");
    const [jobDescriptionPdf, setJobDescriptionPdf] = useState("");
    const [jobDescriptionFileName, setJobDescriptionFileName] = useState("");
    const [filterType, setFilterType] = useState("mostSkills");
    const [sortOrder, setSortOrder] = useState("asc");
    const [sessionTitle, setSessionTitle] = useState("");

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

                // token invalid atau user sudah tidak ada
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
            setLoading(true);
            setError("");
            try {
                const sessionId = params?.sessionId;
                setLoading(false);
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

                if (data.jobDescription) {

                    // Manual Text
                    if (data.jobDescription.content) {

                        setJobDescriptionText(
                            data.jobDescription.content
                        )
                    }

                    // PDF / DOC / DOCX
                    else if (data.jobDescription.filePath) {

                        const fileName =
                            data.jobDescription.filePath
                                .split(/[\\/]/)
                                .pop()

                        const fileUrl =
                            `http://localhost:5000/uploads/${fileName}`

                        setJobDescriptionPdf(fileUrl)

                        setJobDescriptionFileName(
                            data.jobDescription.fileName || "Job Description"
                        )
                    }
                }

                if (
                    data.results.length > 0 &&
                    data.results[0].session?.title
                ) {
                    setSessionTitle(
                        data.results[0].session.title
                    );
                }

                const mappedCandidates = data.results.map((result: any) => {
                    const scorePercent = Number(result.score);
                    const style = getTier(scorePercent);

                    return {
                        id: result.id,
                        name:
                            result.candidateName ||
                            result.cvFile.fileName.replace(
                                /\.(pdf|docx|doc)$/i,
                                ""
                            ),
                        cv: result.cvFile.fileName,
                        score: scorePercent,
                        label: style.label,
                        reasoning: result.reasoning,
                        matchedSkills:
                            result.matchedSkills || [],
                        unmatchedSkills:
                            result.unmatchedSkills || [],
                        labelColor:
                            style.labelColor,
                        ringColor:
                            style.ringColor,
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

        if (!sessionId) return;
        fetchResults();
    }, [sessionId]);

    useEffect(() => {
        const checkOverflow = () => {
            if (descRef.current) {
                setShowReadMore(
                    descRef.current.scrollHeight >
                    descRef.current.clientHeight
                )
            }
        }

        checkOverflow()

        window.addEventListener(
            "resize",
            checkOverflow
        )

        return () => {
            window.removeEventListener(
                "resize",
                checkOverflow
            )
        }

    }, [jobDescriptionText])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted text-sm">
                    Memuat hasil analisis...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-red-500 text-sm">
                    {error}
                </p>
            </div>
        );
    }

    const processedCandidates = [...candidates].sort((a, b) => {

        let comparison = 0;

        switch (filterType) {

            case "mostSkills":
                comparison =
                    b.matchedSkills.length -
                    a.matchedSkills.length;
                break;

            case "leastSkills":
                comparison =
                    a.matchedSkills.length -
                    b.matchedSkills.length;
                break;

            case "name":
                comparison =
                    a.name.localeCompare(b.name);
                break;

            default:
                comparison = 0;
        }

        return sortOrder === "asc"
            ? comparison
            : -comparison;
    });

    const totalPages = Math.ceil(
        processedCandidates.length /
        candidatesPerPage
    );

    const startIndex =
        (currentPage - 1) *
        candidatesPerPage;

    const currentCandidates =
        processedCandidates.slice(
            startIndex,
            startIndex + candidatesPerPage
        );

    return (
        <div className="min-h-screen bg-background flex flex-col">
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="flex flex-1">

                {/* Main Content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {/* Header */}
                    <div className="mb-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hasil Analisis</h1>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted">
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                                <path d="M5 3V2M11 3V2M2 7h12" />
                            </svg>
                            {sessionTitle || `Session #${params.sessionId}`}
                        </div>
                    </div>

                    {/* Job Description Card */}
                    <div className="bg-card border border-border rounded-xl p-5 mb-5">
                        <h2 className="text-sm font-semibold text-foreground mb-3">
                            Deskripsi Pekerjaan
                        </h2>
                        {jobDescriptionPdf ? (
                            <div className="bg-background border border-border rounded-lg p-5">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                PDF
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-red-500" />
                                            <p className="font-medium text-foreground break-all">
                                                {jobDescriptionFileName}
                                            </p>
                                        </div>

                                        <p className="text-sm text-muted mt-2">
                                            Deskripsi Pekerjaan diunggah dalam format PDF. Klik tombol "Buka Dokumen" untuk melihat detailnya.
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <a
                                            href={jobDescriptionPdf}
                                            target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Buka Dokumen
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    ref={descRef}
                                    className={`
                                        relative transition-all duration-300 
                                        ${descExpanded
                                            ? "max-h-[400px] overflow-y-auto pr-2"
                                            : "max-h-[130px] overflow-hidden"
                                        }
                                    `}
                                >
                                    <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                                        {jobDescriptionText}
                                    </div>

                                    {!descExpanded && showReadMore && (
                                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                                    )}
                                </div>

                                {showReadMore && (
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={() =>
                                                setDescExpanded(
                                                    !descExpanded
                                                )
                                            }
                                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                            {descExpanded
                                                ? "Tampilkan Lebih Sedikit"
                                                : "Selengkapnya"}

                                            <ChevronDown
                                                className={`
                                                    w-4 h-4 transition-transform 
                                                    ${descExpanded
                                                        ? "rotate-180"
                                                        : ""
                                                    }
                                                `}
                                            />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted">Total Kandidat</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {candidates.length}
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted">Rata-rata Skor</p>
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
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted">Sangat Sesuai</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 85 &&
                                            c.score <= 100
                                    ).length
                                }
                                <span className="text-sm font-normal text-muted">kandidat</span>
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted">Cukup Sesuai</p>
                            <p className="text-2xl font-bold text-yellow-500 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 70 &&
                                            c.score < 85
                                    ).length
                                }
                                <span className="text-sm font-normal text-muted">kandidat</span>
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
                            <p className="text-xs text-muted">Kurang Sesuai</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">
                                {
                                    candidates.filter(
                                        (c) =>
                                            c.score >= 50 &&
                                            c.score < 70
                                    ).length
                                }
                                <span className="text-sm font-normal text-muted">kandidat</span>
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted">
                                Tidak Sesuai
                            </p>

                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {
                                    candidates.filter(
                                        (c) => c.score < 50
                                    ).length
                                }
                                <span className="text-sm font-normal text-muted">kandidat</span>
                            </p>
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div className="relative mb-4">
                        <div
                            className={`
                            bg-card border border-border rounded-xl px-5 py-4 
                            ${!isLoggedIn
                                    ? "blur-[2px] pointer-events-none select-none"
                                    : ""}
                        `}
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* Filter */}
                                <div className="flex items-center gap-3">
                                    <SlidersHorizontal className="w-4 h-4 text-muted" />
                                    <span className="text-sm text-muted">
                                        Filter:
                                    </span>
                                    <select
                                        value={filterType}
                                        onChange={(e) =>
                                            setFilterType(e.target.value)
                                        }
                                        className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="mostSkills">
                                            Skill terbanyak
                                        </option>
                                        <option value="leastSkills">
                                            Skill tersedikit
                                        </option>
                                        <option value="name">
                                            Nama kandidat
                                        </option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-3">
                                    <ArrowUpDown className="w-4 h-4 text-muted" />
                                    <span className="text-sm text-muted">
                                        Urutkan :
                                    </span>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) =>
                                            setSortOrder(e.target.value)
                                        }
                                        className="h-9 min-w-[160px] px-3 rounded-lg border border-blue-600 bg-blue-600 text-white text-sm font-medium focus:outline-none">
                                        <option value="asc">
                                            Menaik
                                        </option>
                                        <option value="desc">
                                            Menurun
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Guest Overlay */}
                        {!isLoggedIn && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <a
                                    href="/login"
                                    className="flex items-center gap-2 bg-card border border-border text-foreground text-sm font-medium px-5 py-2 rounded-full shadow-lg hover:bg-sidebar-hover transition-colors">
                                    <Lock className="w-4 h-4" />
                                    Login untuk menggunakan filter
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Candidate Count */}
                    <p className="text-sm text-muted mb-3">
                        Menampilkan{" "}
                        <span className="font-semibold text-foreground">
                            {currentCandidates.length}
                        </span>{" "}
                        dari {processedCandidates.length} kandidat
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
                            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed"
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
                                        ? "bg-blue-600 text-white" : "bg-card border border-border text-foreground hover:bg-sidebar-hover"}
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
                            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ›
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}