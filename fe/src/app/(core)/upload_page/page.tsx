"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Info } from "lucide-react";

export default function UploadPage() {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
    const [isDraggingJobDesc, setIsDraggingJobDesc] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userName, setUserName] = useState("Tamu");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const jobDescriptionFileRef = useRef<HTMLInputElement>(null);
    const maxCVUpload = isLoggedIn ? 20 : 10;

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

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(
            (f) =>
                f.type === "application/pdf" ||
                f.name.endsWith(".docx") ||
                f.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        if (files.length > 0) {
            setUploadedFiles((prev) => {
                const combined = [...prev, ...files];
                return combined.slice(0, maxCVUpload);
            });
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles((prev) => {
                const combined = [...prev, ...files];
                return combined.slice(0, maxCVUpload);
            });
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Job Description Upload
    const handleJobDescriptionDrop = (
        e: DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        if (jobDescription.trim().length > 0) {
            return;
        }
        setIsDraggingJobDesc(false);

        const file = e.dataTransfer.files[0];

        if (
            file &&
            (
                file.type === "application/pdf" ||
                file.name.endsWith(".docx") ||
                file.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        ) {
            setJobDescriptionFile(file);
        }
    };

    const handleJobDescriptionFileChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (
            file &&
            (
                file.type === "application/pdf" ||
                file.name.endsWith(".docx") ||
                file.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        ) {
            setJobDescriptionFile(file);
        }
    };

    const removeJobDescriptionFile = () => {
        setJobDescriptionFile(null);

        if (jobDescriptionFileRef.current) {
            jobDescriptionFileRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validation
            if (uploadedFiles.length === 0) {
                alert("Minimal upload 1 CV");
                return;
            }

            if (
                !jobDescriptionFile &&
                jobDescription.trim().length < 50
            ) {
                alert("Job description minimal 50 karakter");
                return;
            }

            // Token
            const token = localStorage.getItem("token");
            const headers: HeadersInit = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            console.log("TOKEN :", token);
            console.log("HEADERS :", headers);
            // Create Session
            const sessionRes = await fetch(
                "http://localhost:5000/api/upload/session",
                {
                    method: "POST",
                    headers,
                }
            );

            const sessionData = await sessionRes.json();

            if (!sessionRes.ok) {
                throw new Error(
                    sessionData.error || "Failed create session"
                );
            }

            const sessionId = sessionData.session.id;

            localStorage.setItem(
                "currentSessionId",
                sessionId.toString()
            );

            // Upload CV
            const cvFormData = new FormData();

            cvFormData.append(
                "sessionId",
                sessionId.toString()
            );

            uploadedFiles.forEach((file) => {
                cvFormData.append("cvs", file);
            });

            const cvRes = await fetch(
                "http://localhost:5000/api/upload/cv",
                {
                    method: "POST",
                    headers: {
                        ...(token && {
                            Authorization: `Bearer ${token}`,
                        }),
                    },
                    body: cvFormData,
                }
            );

            const cvData = await cvRes.json();

            if (!cvRes.ok) {
                throw new Error(
                    cvData.error || "CV upload failed"
                );
            }

            // Upload Job Description
            const jobFormData = new FormData();

            jobFormData.append(
                "sessionId",
                sessionId.toString()
            );

            // upload file
            if (jobDescriptionFile) {
                jobFormData.append(
                    "job",
                    jobDescriptionFile
                );
            }

            // manual text
            else {
                jobFormData.append(
                    "content",
                    jobDescription
                );
            }

            const jobRes = await fetch(
                "http://localhost:5000/api/upload/job",
                {
                    method: "POST",
                    headers: {
                        ...(token && {
                            Authorization: `Bearer ${token}`,
                        }),
                    },
                    body: jobFormData,
                }
            );

            const jobData = await jobRes.json();

            if (!jobRes.ok) {
                throw new Error(
                    jobData.error || "Job description upload failed"
                );
            }

            // Analyze
            const analyzeRes = await fetch(
                `http://localhost:5000/api/upload/analyze/${sessionId}`,
                {
                    method: "POST",
                }
            );

            const analyzeData = await analyzeRes.json();

            if (!analyzeRes.ok) {
                throw new Error(
                    analyzeData.error || "Analyze failed"
                );
            }

            console.log(analyzeData);

            // Redirect Result Page
            window.location.replace(`/analysis_result/${sessionId}`);

        } catch (error: any) {
            console.error(error);

            alert(
                error.message || "Terjadi kesalahan"
            );
        }
    };

    const hasValidTextJobDescription =
        jobDescription.trim().length >= 50;

    const hasJobDescriptionFile =
        !!jobDescriptionFile;

    const isFormValid =
        uploadedFiles.length > 0 &&
        (
            hasValidTextJobDescription ||
            hasJobDescriptionFile
        ) &&
        !(
            hasValidTextJobDescription &&
            hasJobDescriptionFile
        );

    return (
        <div className="min-h-screen bg-background">
            {/* Top Banner - Guest Only */}
            {authChecked && !isLoggedIn && showBanner && (
                <div className="bg-teal-600 text-white px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                            <a href="/login" className="underline font-medium">
                                Masuk
                            </a>{" "}
                            untuk mendapatkan hasil ranking otomatis dan filter kandidat.
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

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Unggah CV & Deskripsi Pekerjaan
                    </h1>
                    <p className="text-muted mt-1 text-sm sm:text-base">
                        Unggah berkas CV kandidat dan masukkan deskripsi pekerjaan untuk memulai analisis semantik.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        {/* Upload CV Card */}
                        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">Unggah CV</h2>
                                    <p className="text-xs text-muted">Format PDF atau DOCX</p>
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging
                                    ? "border-teal-500 bg-teal-50" : "border-border bg-brackground hover:border-teal-400 hover:bg-teal-50"
                                    }`}
                            >
                                <svg
                                    className={`w-10 h-10 mb-3 ${isDragging ? "text-teal-500" : "text-muted"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm font-semibold text-muted">
                                    Seret & lepas berkas CV
                                </p>
                                <p className="text-sm text-muted mt-1">
                                    atau{" "}
                                    <span className="text-teal-600 underline font-medium">
                                        klik untuk memilih berkas
                                    </span>
                                </p>
                                <p className="text-xs text-muted mt-2">
                                    PDF, DOCX • Maks. {maxCVUpload} per berkas
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    aria-label="Upload CV files"
                                />
                            </div>

                            {/* File List */}
                            {uploadedFiles.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {uploadedFiles.map((file, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-muted truncate">{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                className="text-muted hover:text-red-500 ml-2 flex-shrink-0"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Job Description Card */}
                        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Deskripsi Pekerjaan
                                    </h2>

                                    <p className="text-xs text-muted">
                                        Ketik manual atau unggah 1 berkas PDF/DOCX
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Upload Area */}
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingJobDesc(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDraggingJobDesc(false);
                                    }}
                                    onDrop={handleJobDescriptionDrop}
                                    onClick={() => {
                                        if (jobDescription.trim().length > 0) return;
                                        jobDescriptionFileRef.current?.click();
                                    }}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${jobDescription.trim().length > 0
                                        ? "opacity-50 cursor-not-allowed border-border bg-background" : isDraggingJobDesc
                                            ? "border-teal-500 bg-teal-50 cursor-pointer" : "border-border bg-brackground hover:border-teal-400 hover:bg-teal-50 cursor-pointer"}
                                        `}
                                >
                                    <svg
                                        className={`w-8 h-8 mb-2 ${isDraggingJobDesc ? "text-teal-500" : "text-muted"
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.5"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>

                                    <p className="text-sm font-semibold text-muted">
                                        Seret & lepas berkas deskripsi pekerjaan
                                    </p>

                                    <p className="text-sm text-muted mt-1">
                                        atau{" "}
                                        <span className="text-teal-600 underline font-medium">
                                            klik untuk memilih berkas
                                        </span>
                                    </p>

                                    <p className="text-xs text-muted mt-2">
                                        PDF atau DOCX • Maks. 1 berkas
                                    </p>

                                    <input
                                        ref={jobDescriptionFileRef}
                                        type="file"
                                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleJobDescriptionFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Uploaded File */}
                                {jobDescriptionFile && (
                                    <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>

                                            <span className="text-muted truncate">
                                                {jobDescriptionFile.name}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={removeJobDescriptionFile}
                                            className="text-muted hover:text-red-500 ml-2 flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Text Area */}
                                <div>
                                    <label htmlFor="job-description" className="sr-only">
                                        Deskripsi Pekerjaan
                                    </label>

                                    <textarea
                                        id="job-description"
                                        value={jobDescription}
                                        disabled={!!jobDescriptionFile}
                                        onChange={(e) => {
                                            if (jobDescriptionFile) return;
                                            if (e.target.value.length <= 10000) {
                                                setJobDescription(e.target.value);
                                            }
                                        }}
                                        placeholder={"Contoh:\n\nKami mencari Software Engineer dengan pengalaman minimal 3 tahun di..."}
                                        maxLength={10000}
                                        className="w-full min-h-[220px] sm:min-h-[260px] resize-none border border-border rounded-xl p-4 text-sm text-foreground bg-card placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted">
                                            Minimal 50 karakter untuk analisis terbaik
                                        </span>

                                        <span className="text-xs text-muted">
                                            {jobDescription.length}/10,000
                                        </span>
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-2">
                                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>

                                    <p className="text-xs text-muted">
                                        <span className="font-semibold">Tips:</span>{" "}
                                        Sertakan kualifikasi, skill teknis, dan tanggung jawab pekerjaan untuk hasil analisis yang lebih akurat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`w-full max-w-2xl flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm sm:text-base font-semibold transition-all ${isFormValid
                                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                                : "bg-gray-200 text-muted cursor-not-allowed"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Analisis Sekarang
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                        {!isFormValid && (
                            <p className="text-xs text-muted">
                                Unggah minimal 1 CV dan isi deskripsi pekerjaan untuk melanjutkan
                            </p>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}