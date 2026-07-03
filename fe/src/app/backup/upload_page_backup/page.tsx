"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, Menu, X } from "lucide-react";

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
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);

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
        const savedSidebarState =
            localStorage.getItem("desktopSidebarOpen");

        if (savedSidebarState !== null) {
            setDesktopSidebarOpen(
                JSON.parse(savedSidebarState)
            );
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "desktopSidebarOpen",
            JSON.stringify(desktopSidebarOpen)
        );
    }, [desktopSidebarOpen]);

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
            window.location.href = `/analysis_result/${sessionId}`;

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
        <div className="min-h-screen bg-gray-50">
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

            <div className="flex min-h-screen">
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
                    <div className="md:hidden flex justify-end px-3 mb-2">
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

                            {/* Toggle Desktop */}
                            <button
                                onClick={() =>
                                    setDesktopSidebarOpen(!desktopSidebarOpen)
                                }
                                className="hidden md:flex items-center justify-center absolute right-2 w-7 h-7 rounded-lg bg-white
                                border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100"
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
                            href="#"
                            className={`
                                flex items-center rounded-lg text-sm font-medium transition-all bg-teal-600 text-white
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {desktopSidebarOpen && "Unggah CV"}
                        </a>
                        <a
                            href="../analysis_result"
                            className={`
                                flex items-center rounded-lg text-sm font-medium hover:bg-gray-100 transition-all
                                ${desktopSidebarOpen
                                    ? "gap-3 px-3 py-2.5" : "justify-center py-3"}
                                text-gray-600
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 ２h-２a２ ２ ０ ０１-２ -２z" />
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
                        flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 transition-all duration-300 md:ml-[72px]
                        ${desktopSidebarOpen
                            ? "lg:ml-[240px]" : "lg:ml-[72px]"}
                    `}
                >

                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Unggah CV & Deskripsi Pekerjaan
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">
                            Unggah berkas CV kandidat dan masukkan deskripsi pekerjaan untuk memulai analisis semantik.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            {/* Upload CV Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">Unggah CV</h2>
                                        <p className="text-xs text-gray-400">Format PDF atau DOCX</p>
                                    </div>
                                </div>

                                {/* Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging
                                        ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50"
                                        }`}
                                >
                                    <svg
                                        className={`w-10 h-10 mb-3 ${isDragging ? "text-teal-500" : "text-gray-400"}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm font-semibold text-gray-700">
                                        Seret & lepas berkas CV
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        atau{" "}
                                        <span className="text-teal-600 underline font-medium">
                                            klik untuk memilih berkas
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
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
                                                    <span className="text-gray-700 truncate">{file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
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
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Deskripsi Pekerjaan
                                        </h2>

                                        <p className="text-xs text-gray-400">
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
                                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-100" : isDraggingJobDesc
                                                ? "border-teal-500 bg-teal-50 cursor-pointer" : "border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"}
                                        `}
                                    >
                                        <svg
                                            className={`w-8 h-8 mb-2 ${isDraggingJobDesc ? "text-teal-500" : "text-gray-400"
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

                                        <p className="text-sm font-semibold text-gray-700">
                                            Seret & lepas berkas deskripsi pekerjaan
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            atau{" "}
                                            <span className="text-teal-600 underline font-medium">
                                                klik untuk memilih berkas
                                            </span>
                                        </p>

                                        <p className="text-xs text-gray-400 mt-2">
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

                                                <span className="text-gray-700 truncate">
                                                    {jobDescriptionFile.name}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={removeJobDescriptionFile}
                                                className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
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
                                                if (e.target.value.length <= 2000) {
                                                    setJobDescription(e.target.value);
                                                }
                                            }}
                                            placeholder={"Contoh:\n\nKami mencari Software Engineer dengan pengalaman minimal 3 tahun di..."}
                                            maxLength={2000}
                                            className="w-full min-h-[220px] sm:min-h-[260px] resize-none border border-gray-200 rounded-xl p-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-400">
                                                Minimal 50 karakter untuk analisis terbaik
                                            </span>

                                            <span className="text-xs text-gray-400">
                                                {jobDescription.length}/2,000
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-2">
                                        <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>

                                        <p className="text-xs text-gray-700">
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
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                                <p className="text-xs text-gray-400">
                                    Unggah minimal 1 CV dan isi deskripsi pekerjaan untuk melanjutkan
                                </p>
                            )}
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}