"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
    name: string;
    displayName: string | null;
    email: string;
    profileImage: string | null;
}


export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = e.target.files?.[0];

        if (!file) return;

        const formData = new FormData();

        formData.append("photo", file);

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/profile/photo",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error();
            }

            await fetchProfile();

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            setProfile(data);

        } catch (error) {
            console.error(error);
        }
    };

    if (!profile) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Main content */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-12 mt-14 md:mt-0">
                <div className="w-full max-w-2xl bg-card rounded-2xl shadow-sm border border-border px-6 py-10 md:px-12 md:py-12">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-3">
                            <div className="w-36 h-36 rounded-full border-4 border-border bg-card flex items-center justify-center overflow-hidden">
                                {profile.profileImage ? (
                                    <img
                                        src={`http://localhost:5000${profile.profileImage}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg
                                        viewBox="0 0 140 140"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-full h-full"
                                    >
                                        <circle cx="70" cy="70" r="70" fill="currentColor" className="text-card" />
                                        <circle cx="70" cy="52" r="22" fill="currentColor" className="text-foreground" />
                                        <ellipse cx="70" cy="110" rx="38" ry="28" fill="currentColor" className="text-foreground" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-base font-medium text-foreground hover:text-blue-600 transition-colors">
                            Ubah
                            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                                <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-9.5 9.5A2 2 0 0 1 5.5 16.5H4a.5.5 0 0 1-.5-.5v-1.5a2 2 0 0 1 .586-1.414l9.5-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="m11.5 5.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>

                    {/* Form fields */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Nama Tampilan</label>
                            <input
                                type="text"
                                placeholder="ExampleName"
                                value={
                                    profile.displayName ||
                                    profile.name.split(" ")[0]
                                }
                                readOnly
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors`}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={profile.email}
                                readOnly
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors`}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end mt-10 gap-3">
                        <Link href="/profile/edit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">
                            Ubah profil
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}