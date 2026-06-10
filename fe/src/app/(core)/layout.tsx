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
        const user =
            localStorage.getItem("user");

        if (user) {
            try {
                const parsed =
                    JSON.parse(user);

                setIsLoggedIn(true);

                if (parsed?.name) {
                    setUserName(parsed.name);
                }
            } catch {
                setIsLoggedIn(false);
                setUserName("Tamu");
            }
        }
    }, []);

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
            />

            <main
                className={`
                    min-h-screen bg-gray-50
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