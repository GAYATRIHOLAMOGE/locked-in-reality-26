"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Shield, Plus, Trash2, Loader2, Users, Trophy, RefreshCw, LogOut } from "lucide-react";

export default function AdminPanel() {
    const router = useRouter();
    const [isAuthed, setIsAuthed] = useState(false);
    const [adminPass, setAdminPass] = useState("");

    const [newName, setNewName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    useEffect(() => {
        const pass = sessionStorage.getItem("adminPass");
        if (sessionStorage.getItem("adminAuthed") !== "true" || !pass) {
            router.push("/supersecretaccessportal");
        } else {
            setAdminPass(pass);
            setIsAuthed(true);
        }
    }, [router]);

    const { data: teams, isLoading: teamsLoading, refetch } = api.admin.listTeams.useQuery(
        { adminPassword: adminPass },
        { enabled: isAuthed && !!adminPass }
    );

    const createTeam = api.admin.createTeam.useMutation({
        onSuccess: (data) => {
            setCreateMsg({ type: "ok", text: `Team "${data.name}" created!` });
            setNewName("");
            setNewPassword("");
            refetch();
        },
        onError: (e) => setCreateMsg({ type: "err", text: e.message }),
    });

    const deleteTeam = api.admin.deleteTeam.useMutation({
        onSuccess: () => refetch(),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateMsg(null);
        createTeam.mutate({ adminPassword: adminPass, name: newName, password: newPassword });
    };

    const handleLogout = () => {
        sessionStorage.removeItem("adminAuthed");
        sessionStorage.removeItem("adminPass");
        router.push("/supersecretaccessportal");
    };

    if (!isAuthed) return null;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <Shield className="text-amber-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">Admin Panel</h1>
                            <p className="text-xs text-slate-500">Locked In Reality</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg transition-colors"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg transition-colors"
                        >
                            <LogOut size={13} /> Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create Team */}
                    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Plus size={16} className="text-violet-400" />
                            <h2 className="font-bold text-white">Create Team</h2>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">Team Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-600"
                                    placeholder="e.g. ByteBusters"
                                    required
                                    minLength={2}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">Password</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-600"
                                    placeholder="Min 4 characters"
                                    required
                                    minLength={4}
                                />
                            </div>

                            {createMsg && (
                                <p className={`text-sm text-center rounded-lg py-2 px-3 ${createMsg.type === "ok" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"}`}>
                                    {createMsg.text}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={createTeam.isPending}
                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {createTeam.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                Create Team
                            </button>
                        </form>
                    </div>

                    {/* Scoreboard */}
                    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Users size={16} className="text-emerald-400" />
                            <h2 className="font-bold text-white">Teams</h2>
                            {teams && (
                                <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                    {teams.length} registered
                                </span>
                            )}
                        </div>

                        {teamsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-slate-600" size={24} />
                            </div>
                        ) : teams && teams.length > 0 ? (
                            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                {teams.map((team, i) => (
                                    <div
                                        key={team.id}
                                        className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-600 w-5 text-right font-mono">#{i + 1}</span>
                                            <span className="font-medium text-white text-sm">{team.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-yellow-500 text-xs font-mono">
                                                <Trophy size={11} />
                                                {team.score}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete team "${team.name}"?`)) {
                                                        deleteTeam.mutate({ adminPassword: adminPass, teamId: team.id });
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-rose-400"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-600 text-sm text-center py-8">No teams yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
