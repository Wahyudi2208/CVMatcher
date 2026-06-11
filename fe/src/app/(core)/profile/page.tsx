"use client";

import { useState } from "react";

interface UserProfile {
    displayName: string;
    email: string;
    password: string;
    avatarUrl: string | null;
}

const initialProfile: UserProfile = {
    displayName: "Budi Santoso",
    email: "budi@perusahaan.com",
    password: "ExamplePassword",
    avatarUrl: null,
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<UserProfile>(initialProfile);

    const handleEditToggle = () => {
        setForm(profile);
        setIsEditing(true);
    };

    const handleSave = () => {
        setProfile(form);
        setIsEditing(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setForm((prev) => ({ ...prev, avatarUrl: url }));
        }
    };

    const initials = profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Main content */}
            <main className="flex-1 md:ml-56 flex items-start justify-center px-4 py-8 md:py-12 mt-14 md:mt-0">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-10 md:px-12 md:py-12">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-3">
                            <div className="w-36 h-36 rounded-full border-4 border-gray-900 bg-white flex items-center justify-center overflow-hidden">
                                {form.avatarUrl ? (
                                    <img
                                        src={form.avatarUrl}
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
                                        <circle cx="70" cy="70" r="70" fill="white" />
                                        <circle cx="70" cy="52" r="22" fill="#1a1a1a" />
                                        <ellipse cx="70" cy="110" rx="38" ry="28" fill="#1a1a1a" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-base font-medium text-gray-800 hover:text-blue-600 transition-colors">
                            Edit
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
                            <label className="text-sm font-medium text-gray-700">Display Name</label>
                            <input
                                type="text"
                                placeholder="ExampleName"
                                value={isEditing ? form.displayName : profile.displayName}
                                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                                readOnly={!isEditing}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors ${isEditing
                                    ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-100"
                                    : "border-gray-200 bg-gray-50 cursor-default"
                                    }`}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={isEditing ? form.email : profile.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                readOnly={!isEditing}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors ${isEditing
                                    ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-100"
                                    : "border-gray-200 bg-gray-50 cursor-default"
                                    }`}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                placeholder="ExamplePassword"
                                value={isEditing ? form.password : profile.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                readOnly={!isEditing}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors ${isEditing
                                    ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-100"
                                    : "border-gray-200 bg-gray-50 cursor-default"
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end mt-10 gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    Simpan
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditToggle}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors"
                            >
                                Edit profile
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}