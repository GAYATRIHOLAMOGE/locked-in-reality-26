"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Lock, Unlock, ArrowRight, Loader2 } from "lucide-react";

export default function TeamAuth() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
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

    const registerMutation = api.team.register.useMutation({
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
        if (isLogin) {
            loginMutation.mutate({ name, password });
        } else {
            registerMutation.mutate({ name, password });
        }
    };

    const isLoading = loginMutation.isPending || registerMutation.isPending;

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-700 shadow-2xl skew-x-0 transition-all hover:border-violet-500/50">
            <div className="flex justify-center mb-6 text-violet-400">
                {isLogin ? <Lock size={48} /> : <Unlock size={48} />}
            </div>

            <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-shadow">
                {isLogin ? "Authenticate" : "Initialize Team"}
            </h2>
            <p className="text-center text-slate-400 mb-8">
                {isLogin
                    ? "Enter your credentials to resume the simulation."
                    : "Register your team to enter Locked in Reality."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Team Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-600"
                        placeholder="e.g. ByteBusters"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Access Code
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="text-rose-500 text-sm text-center bg-rose-500/10 py-2 rounded border border-rose-500/20">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            {isLogin ? "Access System" : "Register Team"}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-slate-400 hover:text-white transition-colors underline decoration-slate-700 hover:decoration-white underline-offset-4"
                >
                    {isLogin
                        ? "Need to register a team? Click here."
                        : "Already have a team? Login here."}
                </button>
            </div>
        </div>
    );
}
