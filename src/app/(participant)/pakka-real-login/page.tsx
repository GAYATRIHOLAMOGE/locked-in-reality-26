"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function RealLoginPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const loginMutation = api.team.login.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("teamId", data.id);
            localStorage.setItem("teamName", data.name);
            router.push("/dashboard");
        },
        onError: (e) => setError(e.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        loginMutation.mutate({ name, password });
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[45%] h-[45%] bg-violet-700/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-fuchsia-700/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Badge */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-400 text-xs font-medium">
                        <ShieldCheck size={13} />
                        SECURE ACCESS TERMINAL
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-2">
                        LOCKED IN
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> REALITY</span>
                    </h1>
                    <p className="text-slate-500 text-sm">Team authentication required to begin</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                            <Lock className="text-violet-400" size={28} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                                Team Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder:text-slate-600 transition-all"
                                placeholder="e.g. ByteBusters"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                                Access Code
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder:text-slate-600 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-rose-400 text-sm text-center bg-rose-500/10 py-2.5 rounded-xl border border-rose-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-900/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
                        >
                            {loginMutation.isPending ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Access System
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
