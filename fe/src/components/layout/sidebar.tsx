"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, MoreHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

interface HistoryItem {
    id: number;
    title: string;
    createdAt: string;
}

interface SidebarProps {
    desktopSidebarOpen: boolean;
    setDesktopSidebarOpen: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    isLoggedIn: boolean;
    userName: string;
    history: HistoryItem[];
    setHistory: React.Dispatch<
        React.SetStateAction<HistoryItem[]>
    >;
}

export default function Sidebar({
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    isLoggedIn,
    userName,
    history,
    setHistory,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [hoveredHistoryId, setHoveredHistoryId] = useState<number | null>(null);
    const [openedMenuId, setOpenedMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] =
        useState({
            x: 0,
            y: 0,
        });
    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [editingTitle, setEditingTitle] =
        useState("");

    useEffect(() => {
        localStorage.setItem(
            "desktopSidebarOpen",
            JSON.stringify(desktopSidebarOpen)
        );
    }, [desktopSidebarOpen]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentSessionId =
                    localStorage.getItem(
                        "currentSessionId"
                    );

                if (!currentSessionId) {
                    setShowAnalysisMenu(false);
                    return;
                }

                const res = await fetch(
                    `http://localhost:5000/api/upload/session/${currentSessionId}`
                );

                if (!res.ok) {
                    setShowAnalysisMenu(false);
                    return;
                }

                const session =
                    await res.json();

                setShowAnalysisMenu(
                    session.status ===
                    "PROCESSED"
                );

            } catch {
                setShowAnalysisMenu(false);
            }
        };

        checkSession();
    }, [pathname]);

    useEffect(() => {
        const sessionId =
            localStorage.getItem(
                "currentSessionId"
            );

        setCurrentSessionId(sessionId);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpenedMenuId(null);
            }
        };

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape"
            ) {
                setOpenedMenuId(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    const isActive = (path: string) => {

        if (path === "/analysis_result") {
            return pathname.startsWith(
                "/analysis_result"
            );
        }

        if (path === "/profile") {
            return pathname.startsWith(
                "/profile"
            );
        }

        return pathname === path;
    };

    const handleUploadClick = async (
        e: React.MouseEvent<HTMLAnchorElement>
    ) => {

        const isGuest = !isLoggedIn;

        const sessionId =
            localStorage.getItem(
                "currentSessionId"
            );

        const hasAnalysis = !!sessionId;

        if (!isGuest || !hasAnalysis) {
            return;
        }

        e.preventDefault();

        const result = await Swal.fire({
            icon: "warning",
            title: "Analisis Baru ?",
            text: "Memulai analisis baru akan menghapus hasil analisis saat ini.",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText:
                "Mulai Analisis Baru",
            cancelButtonText: "Batal",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            buttonsStyling: false,
            customClass: {
                popup: "custom-swal-popup",
                actions: "custom-swal-actions",
                confirmButton: "custom-swal-confirm",
                cancelButton: "custom-swal-cancel",
            },
        });

        if (result.isConfirmed) {
            try {
                const guestId = localStorage.getItem("guestId");
                if (guestId) {
                    await fetch(
                        "http://localhost:5000/api/upload/guest-session",
                        {
                            method: "DELETE",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                guestId
                            })
                        }
                    );
                }

                localStorage.removeItem(
                    "currentSessionId"
                );

                setCurrentSessionId(null);
                setShowAnalysisMenu(false);

                router.replace("/upload_page");

            } catch (error) {
                console.error(error);
                Swal.fire(
                    "Gagal",
                    "Gagal menghapus analisis sebelumnya.",
                    "error"
                );
            }
        }
    };

    const showLabel = desktopSidebarOpen || mobileSidebarOpen;
    const itemClass = showLabel
        ? "gap-3 px-3 py-2.5"
        : "justify-center py-3";

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-sidebar border-b border-border px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-sidebar-hover transition-colors"
                >
                    <Menu className="w-7 h-7 text-sidebar-foreground" />
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
                        <span className="text-foreground">Matcher</span>
                    </span>
                </div>

                <div className="w-10" />
            </div>

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen bg-sidebar border-r border-border transition-all duration-300 flex flex-col py-4
                    ${desktopSidebarOpen
                        ? "md:w-60"
                        : "md:w-[72px]"
                    }
                    ${mobileSidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }
                    md:translate-x-0 w-64
                `}
            >
                {/* Mobile Close */}
                <div className="md:hidden flex justify-end px-3 mb-2">
                    <button
                        onClick={() =>
                            setMobileSidebarOpen(false)
                        }
                        className="p-2 rounded-lg hover:bg-sidebar-hover"
                    >
                        <X className="w-5 h-5 text-sidebar-foreground" />
                    </button>
                </div>

                {/* Logo */}
                <div className="px-3 mb-4">
                    <div className="group relative flex items-center">
                        <Link
                            href="/landing_page"
                            className={`
                                flex items-center rounded-xl hover:bg-sidebar-hover transition-all
                                ${itemClass
                                    ? "gap-2 px-2 py-2 w-full"
                                    : "justify-center w-full py-2"}
                            `}
                        >
                            <Image
                                src="/img/logo-website.png"
                                alt="CVMatcher Logo"
                                width={28}
                                height={28}
                            />

                            {showLabel && (
                                <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                                    <span className="text-blue-800">CV</span>
                                    <span className="text-foreground">Matcher</span>
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() =>
                                setDesktopSidebarOpen(
                                    !desktopSidebarOpen
                                )
                            }
                            className="hidden md:flex items-center justify-center absolute right-2 w-7 h-7 rounded-lg bg-card border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-sidebar-hover"
                        >
                            {desktopSidebarOpen ? (
                                <X className="w-4 h-4 text-sidebar-foreground" />
                            ) : (
                                <Menu className="w-4 h-4 text-sidebar-foreground" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3">

                    <Link
                        href="/upload_page"
                        onClick={handleUploadClick}
                        className={`
                            flex items-center rounded-lg text-sm font-medium transition-all
                            ${itemClass
                                ? "gap-3 px-3 py-2.5"
                                : "justify-center py-3"}
                            ${isActive("/upload_page")
                                ? "bg-teal-600 text-white"
                                : "text-sidebar-foreground hover:bg-sidebar-hover"}
                        `}
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>

                        {showLabel && "Unggah CV"}
                    </Link>

                    {(isLoggedIn || showAnalysisMenu) && (
                        <div>
                            {/* Parent Menu */}
                            <Link
                                href={
                                    history.length > 0
                                        ? `/analysis_result/${history[0].id}`
                                        : "/analysis_result"
                                }
                                className={`
                                    flex items-center rounded-lg text-sm font-medium transition-all
                                    ${itemClass
                                        ? "gap-3 px-3 py-2.5"
                                        : "justify-center py-3"}
                                    ${isActive("/analysis_result")
                                        ? "bg-teal-600 text-white"
                                        : "text-sidebar-foreground hover:bg-sidebar-hover"}
                                `}
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 ２h-２a２ ２ ０ ０１-２ -２z" />
                                </svg>

                                {showLabel && "Hasil Analisis"}
                            </Link>

                            {/* History */}
                            {showLabel && history.length > 0 && (
                                <div className="ml-6 mt-1 space-y-1 border-l border-border pr-1 pl-3 max-h-72 overflow-y-auto overflow-x-visible">
                                    {history.map((item) => {
                                        const active =
                                            pathname === `/analysis_result/${item.id}`;

                                        return (
                                            <div
                                                key={item.id}
                                                className="relative"
                                                onMouseEnter={() => setHoveredHistoryId(item.id)}
                                                onMouseLeave={() => setHoveredHistoryId(null)}
                                            >
                                                <Link
                                                    href={`/analysis_result/${item.id}`}
                                                    className={`
                                                        flex items-center rounded-md px-3 py-2 text-sm transition-all
                                                        ${active
                                                            ? "bg-teal-600 text-white font-medium"
                                                            : "text-sidebar-foreground hover:bg-sidebar-hover"
                                                        }
                                                    `}
                                                >
                                                    {editingId === item.id ? (
                                                        <input
                                                            autoFocus
                                                            value={editingTitle}
                                                            onChange={(e) =>
                                                                setEditingTitle(
                                                                    e.target.value
                                                                )
                                                            }
                                                            onKeyDown={async (e) => {
                                                                if (
                                                                    e.key === "Escape"
                                                                ) {
                                                                    setEditingId(null);
                                                                    return;
                                                                }

                                                                if (
                                                                    e.key !== "Enter"
                                                                )
                                                                    return;

                                                                const token =
                                                                    localStorage.getItem(
                                                                        "token"
                                                                    );

                                                                const res =
                                                                    await fetch(
                                                                        `http://localhost:5000/api/upload/history/${item.id}`,
                                                                        {
                                                                            method: "PATCH",
                                                                            headers: {
                                                                                "Content-Type":
                                                                                    "application/json",
                                                                                Authorization:
                                                                                    `Bearer ${token}`,
                                                                            },
                                                                            body:
                                                                                JSON.stringify({
                                                                                    title:
                                                                                        editingTitle,
                                                                                }),
                                                                        }
                                                                    );
                                                                if (
                                                                    res.ok
                                                                ) {
                                                                    setHistory((prev) =>
                                                                        prev.map((h) => h.id === item.id
                                                                            ? {
                                                                                ...h,
                                                                                title: editingTitle,
                                                                            }
                                                                            : h
                                                                        )
                                                                    );
                                                                }
                                                                setEditingId(null);
                                                            }}
                                                            className="w-full rounded bg-transparent outline-none" />
                                                    ) : (
                                                        <span
                                                            className={`
                                                                min-w-0 flex-1 truncate
                                                                ${hoveredHistoryId === item.id || openedMenuId === item.id
                                                                    ? "pr-8"
                                                                    : ""}
                                                            `}
                                                        >
                                                            {item.title}
                                                        </span>
                                                    )}
                                                </Link>

                                                {(hoveredHistoryId === item.id ||
                                                    openedMenuId === item.id) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const rect =
                                                                    e.currentTarget.getBoundingClientRect();
                                                                setMenuPosition({
                                                                    x: rect.right + 8,
                                                                    y: rect.top,
                                                                });

                                                                setOpenedMenuId(
                                                                    openedMenuId === item.id
                                                                        ? null
                                                                        : item.id
                                                                );
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sidebar-hover cursor-pointer">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* Bottom Nav */}
                <div className="mt-auto space-y-1 px-3">
                    {isLoggedIn && (
                        <Link
                            href="/profile"
                            className={`
                            flex items-center rounded-lg text-sm font-medium transition-all
                            ${itemClass
                                    ? "gap-3 px-3 py-2.5"
                                    : "justify-center py-3"}
                            ${isActive("/profile")
                                    ? "bg-teal-600 text-white"
                                    : "text-sidebar-foreground hover:bg-sidebar-hover"}
                        `}
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>

                            {showLabel && "Profil"}
                        </Link>
                    )}

                    <Link
                        href="/setting"
                        className={`
                            flex items-center rounded-lg text-sm font-medium transition-all
                            ${itemClass
                                ? "gap-3 px-3 py-2.5"
                                : "justify-center py-3"}
                            ${isActive("/setting")
                                ? "bg-teal-600 text-white"
                                : "text-sidebar-foreground hover:bg-sidebar-hover"}
                        `}
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>

                        {showLabel && "Pengaturan"}
                    </Link>

                    <div
                        className={`
                            flex items-center mt-2
                            ${showLabel
                                ? "gap-3 px-3 py-2.5"
                                : "justify-center py-3"}
                        `}
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {isLoggedIn
                                ? userName.charAt(0).toUpperCase()
                                : "T"}
                        </div>

                        {showLabel && (
                            <span className="text-sm text-sidebar-foreground font-medium">
                                {isLoggedIn ? userName : "Tamu"}
                            </span>
                        )}
                    </div>
                </div>
            </aside>

            {openedMenuId && (
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        left: menuPosition.x,
                        top: menuPosition.y,
                    }}
                    className="z-[9999] w-40 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <button
                        onClick={() => {
                            const historyItem =
                                history.find(
                                    h =>
                                        h.id === openedMenuId
                                );

                            if (!historyItem)
                                return;

                            setEditingId(
                                historyItem.id
                            );

                            setEditingTitle(
                                historyItem.title
                            );
                            setOpenedMenuId(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-sidebar-hover cursor-pointer">
                        Rename
                    </button>
                    <div className="border-t border-border" />
                    <button
                        onClick={async () => {
                            setOpenedMenuId(null);
                            const result =
                                await Swal.fire({
                                    icon: "warning",
                                    title: "Hapus Riwayat?",
                                    text: "Riwayat analisis akan dihapus permanen !",
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

                            if (!result.isConfirmed)
                                return;

                            const token =
                                localStorage.getItem("token");

                            const res =
                                await fetch(
                                    `http://localhost:5000/api/upload/history/${openedMenuId}`,
                                    {
                                        method: "DELETE",
                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`,
                                        },
                                    }
                                );

                            if (!res.ok) {
                                toast.error(
                                    "Riwayat gagal dihapus."
                                );
                                return;
                            }

                            setHistory((prev) =>
                                prev.filter(h => h.id !== openedMenuId)
                            );

                            if (
                                pathname ===
                                `/analysis_result/${openedMenuId}`
                            ) {
                                if (history.length > 1) {
                                    const newest =
                                        history.find(
                                            h =>
                                                h.id !==
                                                openedMenuId
                                        );
                                    if (newest) {
                                        router.replace(
                                            `/analysis_result/${newest.id}`
                                        );
                                    }
                                } else {
                                    router.replace(
                                        "/upload_page"
                                    );
                                }
                            }

                            toast.success(
                                "Riwayat berhasil dihapus."
                            );
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 cursor-pointer">
                        Delete
                    </button>
                </div>
            )}

            {/* Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() =>
                        setMobileSidebarOpen(false)
                    }
                />
            )}
        </>
    );
}