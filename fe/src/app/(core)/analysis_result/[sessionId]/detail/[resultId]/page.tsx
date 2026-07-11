"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ExternalLink,
    FileText,
} from "lucide-react";
import { getTier } from "@/lib/score";

type DetailResult = {
    id: number;
    score: number;
    label: string;
    reasoning: string;
    candidateName: string;
    matchedSkills: string[];
    unmatchedSkills: string[];
    cvContent: string | null;
    cvFile: {
        fileName: string;
        filePath: string;
        fileType: string;
    };
};

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

function SkillBadge({
    skill,
    variant,
}: {
    skill: string;
    variant: "matched" | "unmatched";
}) {
    const base =
        "px-4 py-2 rounded-full text-sm font-medium border";
    const style =
        variant === "matched"
            ? "bg-green-200 text-green-800 dark:bg-green-950 dark:text-green-400"
            : "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-400";
    return (
        <span className={`${base} ${style}`}>{skill}</span>
    );
}

function renderCVContent(content: string) {
    const lines = content
        .split("\n")
        .map((line) => line.trim());

    return lines.map((line, index) => {

        if (line === "") {
            return (
                <div
                    key={index}
                    className="h-4"
                />
            );
        }

        if (line.startsWith("•")) {
            return (
                <div
                    key={index}
                    className="flex items-start gap-3 mb-2 pl-4"
                >
                    <span className="mt-1">•</span>
                    <span className="text-sm leading-7 text-foreground">
                        {line.substring(1).trim()}
                    </span>
                </div>
            );
        }

        return (
            <p
                key={index}
                className="text-sm leading-7 text-foreground mb-2"
            >
                {line}
            </p>
        );
    });
}

export default function ResultDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [result, setResult] =
        useState<DetailResult | null>(null);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            const token = localStorage.getItem("token");
            const guestId = localStorage.getItem("guestId");
            try {
                const res =
                    await fetch(
                        `http://localhost:5000/api/upload/result/${params.resultId}`,
                        {
                            headers: {
                                ...(token
                                    ? {
                                        Authorization:
                                            `Bearer ${token}`
                                    }
                                    : {}),
                                ...(guestId
                                    ? {
                                        "x-guest-id":
                                            guestId
                                    }
                                    : {})
                            }
                        }
                    );
                const data = await res.json();
                if (res.status === 401 || res.status === 403) {
                    router.replace("/upload_page");
                    return;
                }
                if (!res.ok) {
                    throw new Error(
                        data.error ||
                        "Gagal mengambil detail kandidat"
                    );
                }
                setResult(data);
            }
            catch (err: any) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [params]);

    useEffect(() => {
        const handlePageHide = () => {
            setLoading(false);
            setResult(null);
            setError("");
        };

        window.addEventListener("pagehide", handlePageHide);

        return () => {
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted">
                    Memuat Detail Kandidat...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-red-500">
                    {error}
                </p>
            </div>
        );
    }

    if (!result) return null;
    const tier = getTier(result.score);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Back Button */}
                <div className="w-full mb-5">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Hasil Analisis
                    </button>
                </div>
                <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-start justify-between gap-6 px-6 py-6 border-b border-border">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-foreground">
                                {result.candidateName}
                            </h1>

                            <div className="flex items-center gap-2 text-sm text-muted mt-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>{result.cvFile.fileName}</span>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <div className="flex flex-col items-center">
                                <CircleScore
                                    score={result.score}
                                    color={tier.ringColor}
                                />

                                <span
                                    className={`text-sm font-semibold mt-2 ${tier.labelColor}`}
                                >
                                    {tier.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-7 mt-3 border-b border-border">
                        <h2 className="text-xs font-bold tracking-widest text-foreground uppercase mb-3">
                            Skill Sesuai
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {result.matchedSkills.length > 0 ? (
                                result.matchedSkills.map((skill) => (
                                    <SkillBadge
                                        key={skill}
                                        skill={skill}
                                        variant="matched"
                                    />
                                ))
                            ) : (
                                <span className="text-sm text-muted">
                                    Tidak ada skill yang sesuai
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="px-8 py-7 mt-3 border-b border-border">
                        <h2 className="text-xs font-bold tracking-widest text-foreground uppercase mb-3">
                            Skill Tidak Sesuai
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {result.unmatchedSkills.length > 0 ? (
                                result.unmatchedSkills.map((skill) => (
                                    <SkillBadge
                                        key={skill}
                                        skill={skill}
                                        variant="unmatched"
                                    />
                                ))
                            ) : (
                                <span className="text-sm text-muted">
                                    Semua skill telah terpenuhi
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="px-10 py-8 mt-3 border-b border-border">
                        <h2 className="text-xs font-bold tracking-widest text-foreground uppercase mb-3">
                            Isi Berkas CV
                        </h2>
                        <div className="flex flex-col gap-4">
                            {result.cvContent ? (
                                <div className="rounded-lg border border-border bg-background px-6 py-6 max-h-[700px] overflow-y-auto">
                                    <div className="space-y-1">
                                        {renderCVContent(result.cvContent)}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="bg-background border border-border rounded-lg p-5">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                        <div>
                                            <span className=" px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                                                {result.cvFile.fileType.toUpperCase()}
                                            </span>
                                            <div className="flex items-center gap-2 mt-3">
                                                <FileText className="w-5 h-5 text-red-500" />
                                                <span className="font-medium text-foreground">
                                                    {result.cvFile.fileName}
                                                </span>
                                            </div>
                                            <p
                                                className="mt-2 text-sm text-muted">
                                                Isi CV belum tersedia.
                                                Silakan buka dokumen asli.
                                            </p>
                                        </div>
                                        <a
                                            href={`http://localhost:5000/uploads/${result.cvFile.filePath
                                                .split(/[\\/]/)
                                                .pop()
                                                }`}

                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                                            Buka Dokumen
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-8 py-7">
                        <h2 className="text-xs font-bold tracking-widest text-foreground uppercase mb-4">
                            Ringkasan Perbaikan
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                {result.reasoning}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}