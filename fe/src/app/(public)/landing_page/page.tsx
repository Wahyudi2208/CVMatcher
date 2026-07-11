"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <main className="min-h-screen bg-white font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-6 md:px-10 lg:px-16 py-4 flex items-center justify-between">
                <Link href="#" className="flex items-center gap-2">
                    <Image
                        src="/img/logo-website.png"
                        alt="CVMatcher Logo"
                        width={28}
                        height={28}
                        className="rounded-md"
                    />
                    <span className="font-bold text-lg tracking-tight">
                        <span className="text-blue-800">CV</span>
                        <span className="text-gray-900">Matcher</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#fitur" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Fitur</a>
                    <a href="#cara-kerja" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Cara Kerja</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <a href="/login" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">Masuk</a>
                    <a href="/register" className="bg-[#1a6bcc] hover:bg-[#1558b0] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Mulai Sekarang</a>
                </div>

                {/* Mobile hamburger */}
                <button className="md:hidden text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {mobileMenuOpen ? (
                            <>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </>
                        ) : (
                            <>
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </>
                        )}
                    </svg>
                </button>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg md:hidden px-6 py-4 flex flex-col gap-4">
                        <a href="#fitur" className="text-gray-600 text-sm" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
                        <a href="#cara-kerja" className="text-gray-600 text-sm" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
                        <hr className="border-gray-100" />
                        <a href="/login" className="text-gray-600 text-sm">Masuk</a>
                        <a href="/register" className="bg-[#1a6bcc] hover:bg-[#1558b0] text-white text-sm font-medium px-5 py-2 rounded-lg text-center">Mulai Sekarang</a>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-16 bg-gray-50 px-6 md:px-10 lg:px-16">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 py-10">
                    {/* Left */}
                    <div className="flex-1 max-w-xl">
                        <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 mb-6 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                            Powered by SBERT Semantic Matching
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
                            Temukan kandidat terbaik —{" "}
                            <span className="text-[#1a6bcc]">lebih cepat &amp; akurat</span>
                        </h1>
                        <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-8">
                            Sistem pendukung keputusan untuk seleksi kandidat menggunakan analisis similaritas semantik NLP antara CV dan deskripsi pekerjaan.
                        </p>
                        <a href="/upload_page" className="inline-block bg-[#1a6bcc] hover:bg-[#1558b0] text-white font-semibold px-7 py-3 rounded-lg text-sm transition-colors shadow-lg">
                            Coba Sekarang
                        </a>

                        <p className="mt-4 text-sm text-gray-500">
                            ✓ Tanpa instalasi • ✓ Mendukung PDF & Word
                        </p>
                    </div>

                    {/* Right — Real Product Preview */}
                    <div className="flex-1 flex justify-center lg:justify-end w-full">
                        <div className="relative">
                            <Image
                                src="/img/preview.png"
                                alt="Preview Hasil Analisis CVMatcher" width={1200} height={760} priority
                                className="rounded-2xl border border-gray-200 shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                            />
                            {/* Label */}
                            <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
                                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Preview
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fitur Unggulan */}
            <section id="fitur" className="py-20 bg-white px-6 md:px-10 lg:px-16">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Fitur Unggulan</h2>
                        <p className="text-gray-500 text-base md:text-lg">Teknologi AI yang powerful untuk mempercepat proses rekrutmen Anda</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1a6bcc" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 text-base mb-2">Unggah CV Massal</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Unggah puluhan CV sekaligus dalam format PDF atau Word. Sistem kami akan memproses semua berkas secara otomatis dan cepat.</p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-5">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="#16a34a"
                                >
                                    <path d="M22,11A4,4,0,0,0,20,7.52,3,3,0,0,0,20,7a3,3,0,0,0-3-3l-.18,0A3,3,0,0,0,12,2.78,3,3,0,0,0,7.18,4L7,4A3,3,0,0,0,4,7a3,3,0,0,0,0,.52,4,4,0,0,0-.55,6.59A4,4,0,0,0,7,20l.18,0A3,3,0,0,0,12,21.22,3,3,0,0,0,16.82,20L17,20a4,4,0,0,0,3.5-5.89A4,4,0,0,0,22,11ZM11,8.55a4.72,4.72,0,0,0-.68-.32,1,1,0,0,0-.64,1.9A2,2,0,0,1,11,12v1.55a4.72,4.72,0,0,0-.68-.32,1,1,0,0,0-.64,1.9A2,2,0,0,1,11,17v2a1,1,0,0,1-1,1,1,1,0,0,1-.91-.6,4.07,4.07,0,0,0,.48-.33,1,1,0,1,0-1.28-1.54A2,2,0,0,1,7,18a2,2,0,0,1-2-2,2,2,0,0,1,.32-1.06A3.82,3.82,0,0,0,6,15a1,1,0,0,0,0-2,1.84,1.84,0,0,1-.69-.13A2,2,0,0,1,5,9.25a3.1,3.1,0,0,0,.46.35,1,1,0,1,0,1-1.74.9.9,0,0,1-.34-.33A.92.92,0,0,1,6,7,1,1,0,0,1,7,6a.76.76,0,0,1,.21,0,3.85,3.85,0,0,0,.19.47,1,1,0,0,0,1.37.37A1,1,0,0,0,9.13,5.5,1.06,1.06,0,0,1,9,5a1,1,0,0,1,2,0Zm7.69,4.32A1.84,1.84,0,0,1,18,13a1,1,0,0,0,0,2,3.82,3.82,0,0,0,.68-.06A2,2,0,0,1,19,16a2,2,0,0,1-2,2,2,2,0,0,1-1.29-.47,1,1,0,0,0-1.28,1.54,4.07,4.07,0,0,0,.48.33A1,1,0,0,1,14,20a1,1,0,0,1-1-1V17a2,2,0,0,1,1.32-1.87,1,1,0,0,0-.64-1.9,4.72,4.72,0,0,0-.68.32V12a2,2,0,0,1,1.32-1.87,1,1,0,0,0-.64-1.9,4.72,4.72,0,0,0-.68.32V5a1,1,0,0,1,2,0,1.06,1.06,0,0,1-.13.5,1,1,0,0,0,.36,1.37A1,1,0,0,0,16.6,6.5,3.85,3.85,0,0,0,16.79,6,.76.76,0,0,1,17,6a1,1,0,0,1,1,1,1,1,0,0,1-.17.55.9.9,0,0,1-.33.31,1,1,0,0,0,1,1.74A2.66,2.66,0,0,0,19,9.25a2,2,0,0,1-.27,3.62Z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 text-base mb-2">Analisis Semantik</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Teknologi NLP canggih menganalisis makna dan konteks dari CV dan deskripsi pekerjaan, bukan hanya pencocokan kata kunci.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1a6bcc" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 text-base mb-2">Ranking Otomatis</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Kandidat diurutkan berdasarkan tingkat kesesuaian dengan posisi yang Anda butuhkan. Menghemat waktu penyaringan hingga 80%.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cara Kerja */}
            <section id="cara-kerja" className="py-20 bg-gray-50 px-6 md:px-10 lg:px-16">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Cara Kerja</h2>
                        <p className="text-gray-500 text-base md:text-lg">Tiga langkah sederhana untuk menemukan kandidat terbaik</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Step 1 */}
                        <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-2">
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1a6bcc" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-[#1a6bcc] tracking-widest uppercase">Step 01</span>
                            <h3 className="font-bold text-gray-900 text-base">Unggah CV & Deskripsi Pekerjaan</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Unggah CV kandidat dan deskripsi pekerjaan dalam satu klik. Mendukung format PDF dan Word.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-2">
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-[#7c3aed] tracking-widest uppercase">Step 02</span>
                            <h3 className="font-bold text-gray-900 text-base">Analisis AI Otomatis</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">AI kami menganalisis similaritas semantik antara CV dan deskripsi pekerjaan menggunakan NLP.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-2">
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-green-600 tracking-widest uppercase">Step 03</span>
                            <h3 className="font-bold text-gray-900 text-base">Dapatkan Hasil Ranking</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Lihat kandidat terbaik yang diurutkan berdasarkan tingkat kesesuaian. Siap untuk interview.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gray-50 px-6 md:px-10 lg:px-16">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-[#185FA5] to-[#1D9E75] rounded-3xl px-8 md:px-16 py-20 text-center shadow-xl">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                            Siap meningkatkan efisiensi rekrutmen Anda?
                        </h2>
                        <p className="text-blue-200 text-sm md:text-base mb-8">
                            Bergabung dengan ratusan perusahaan yang telah mempercepat proses hiring mereka
                        </p>
                        <a href="/register" className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-[#1a4a7a] font-semibold px-7 py-3 rounded-lg text-sm transition-colors shadow-lg">
                            Daftar Sekarang <span>→</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 px-6 md:px-10 lg:px-16 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <Link href="#" className="flex items-center gap-2">
                            <Image
                                src="/img/logo-website.png"
                                alt="CVMatcher Logo"
                                width={28}
                                height={28}
                                className="rounded-md"
                            />
                            <span className="font-bold text-lg tracking-tight">
                                <span className="text-blue-800">CV</span>
                                <span className="text-gray-900">Matcher</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Sistem pendukung keputusan untuk seleksi kandidat menggunakan analisis similaritas semantik NLP.
                        </p>
                    </div>

                    {/* Produk */}
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-4">Produk</h4>
                        <ul className="space-y-2">
                            <a href="#fitur" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Fitur</a>
                            <br></br>
                            <a href="#cara-kerja" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Cara Kerja</a>
                        </ul>
                    </div>

                    {/* Perusahaan */}
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-4">Perusahaan</h4>
                        <ul className="space-y-2">
                            <a href="#" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Kebijakan Privasi</a>
                        </ul>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
                    © 2026 CVMatcher. All rights reserved.
                </div>
            </footer>
        </main>
    );
}