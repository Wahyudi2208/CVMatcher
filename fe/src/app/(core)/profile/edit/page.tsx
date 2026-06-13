"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const dummyUser = {
    displayName: "ExampleName",
    fullName: "FullnameExample",
    email: "email@example.com",
};

export default function EditProfilePage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState(dummyUser.displayName);
    const [fullName, setFullName] = useState(dummyUser.fullName);
    const [email, setEmail] = useState(dummyUser.email);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    const handleSave = () => {
        // TODO: integrate with API
        console.log({ displayName, fullName, email, oldPassword, newPassword, confirmPassword });
    };

    return (
        <div className="min-h-screen bg-background-100 flex">
            {/* Main content */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-12 mt-14 md:mt-0">
                <div className="w-full max-w-2xl bg-card rounded-2xl shadow-sm border border-border px-6 py-10 md:px-12 md:py-12">
                    {/* Page content */}
                    <div className="flex-1 flex flex-col items-center px-4 py-10 sm:px-8">
                        <div className="w-full max-w-xl">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-8">
                                Personal Information
                            </h1>

                            {/* Personal Info Fields */}
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="ExampleName"
                                        className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="FullnameExample"
                                        className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                    />
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="mb-8">
                                <p className="text-sm text-muted mb-5">Change your password</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Old Password
                                        </label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="YourOldPassword"
                                            className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="YourNewPassword"
                                            className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Confirmation New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="ConfirmationYourNewPassword"
                                            className="w-full px-4 py-2.5 bg-background-100 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-card transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="px-10 py-2.5 bg-background-500 hover:bg-sidebar-hover active:bg-sidebar-hover border border-border text-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSave}
                                    className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}