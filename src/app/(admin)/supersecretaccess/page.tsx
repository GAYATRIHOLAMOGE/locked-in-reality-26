"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

const ADMIN_PASSWORD = "lir_admin_2024";

export default function AdminLogin() {
    const [adminPass, setAdminPass] = useState("");
    const [authError, setAuthError] = useState("");
    const router = useRouter();

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPass === ADMIN_PASSWORD) {
            sessionStorage.setItem("adminAuthed", "true");
            router.push("/admin/supersecretpanel");
        } else {
            setAuthError("Incorrect admin password.");
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                        <Shield className="text-amber-400" size={32} />
                    </div>
                </div>
                <h1 className="text-2xl font-black text-white text-center mb-1">Admin Access</h1>
                <p className="text-slate-500 text-center text-sm mb-8">Enter admin password to continue</p>

                <form onSubmit={handleAuth} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <input
                        type="password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-slate-600"
                        placeholder="Admin password"
                        required
                    />
                    {authError && (
                        <p className="text-rose-400 text-sm text-center">{authError}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                        Authenticate
                    </button>
                </form>
            </div>
        </main>
    );
}
