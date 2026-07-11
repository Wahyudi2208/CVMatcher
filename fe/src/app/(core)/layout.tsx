"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";

export default function CoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [desktopSidebarOpen, setDesktopSidebarOpen] =
        useState(false);

    const [isLoggedIn, setIsLoggedIn] =
        useState(false);

    const [userName, setUserName] =
        useState("Tamu");

    interface HistoryItem {
        id: number;
        title: string;
        createdAt: string;
    }

    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const saved =
            localStorage.getItem("desktopSidebarOpen");

        if (saved !== null) {
            setDesktopSidebarOpen(
                JSON.parse(saved)
            );
        }
    }, []);

    useEffect(() => {
        const syncUser = () => {
            const user =
                localStorage.getItem("user");

            if (!user) {
                setIsLoggedIn(false);
                setUserName("Tamu");
                return;

            }
            try {
                const parsed =
                    JSON.parse(user);
                setIsLoggedIn(true);
                setUserName(
                    parsed.name
                );
            }
            catch {
                setIsLoggedIn(false);
                setUserName("Tamu");
            }
        };
        syncUser();

        window.addEventListener(
            "focus",
            syncUser
        );

        return () => {

            window.removeEventListener(
                "focus",
                syncUser
            );
        };
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            const token =
                localStorage.getItem("token");

            if (!token) {
                setHistory([]);
                return;
            }

            try {
                const res = await fetch(
                    "http://localhost:5000/api/upload/history",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    setHistory([]);
                    localStorage.removeItem(
                        "currentSessionId"
                    );
                    return;
                }

                const data =
                    await res.json();
                setHistory(data);
                if (data.length === 0) {
                    localStorage.removeItem(
                        "currentSessionId"
                    );
                }
            } catch (error) {
                console.error(error);
            }
        };

        if (isLoggedIn) {
            fetchHistory();
        }

    }, [isLoggedIn]);

    return (
        <>
            <Sidebar
                desktopSidebarOpen={
                    desktopSidebarOpen
                }
                setDesktopSidebarOpen={
                    setDesktopSidebarOpen
                }
                isLoggedIn={isLoggedIn}
                userName={userName}
                history={history}
                setHistory={setHistory}
            />

            <main
                className={`
                    min-h-screen bg-background
                    text-foreground
                    transition-all duration-300
                    md:ml-[72px]
                    ${desktopSidebarOpen
                        ? "lg:ml-[240px]"
                        : "lg:ml-[72px]"
                    }
                `}
            >
                {children}
            </main>
        </>
    );
}