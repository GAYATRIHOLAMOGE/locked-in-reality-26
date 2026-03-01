"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
                        <Lock className="text-slate-400" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>
                    <p className="text-slate-500 mt-1 text-sm">Enter your credentials to continue</p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-xl">
                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[#111111] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-600 placeholder:text-slate-600 transition"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-[#111111] border border-[#333] text-white rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-slate-600 placeholder:text-slate-600 transition"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                        >
                            Sign In
                        </button>
                    </form>

                    {/* Footer text with hidden link */}
                    <p className="mt-6 text-center text-xs text-slate-600">
                        Having trouble?{" "}
                        <Link
                            href="/pakka-real-login"
                            className="text-[#1a1a1a] hover:text-[#1a1a1a] no-underline select-none"
                            tabIndex={-1}
                            aria-hidden="true"
                        >
                            Contact support
                        </Link>
                        {" "}or reach out to your administrator.
                    </p>
                </div>
            </div>
        </main>
    );
}
