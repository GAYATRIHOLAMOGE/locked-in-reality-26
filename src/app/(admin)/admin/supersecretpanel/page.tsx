"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Shield, Plus, Trash2, Loader2, Users, Trophy, RefreshCw, LogOut, Play, Square } from "lucide-react";

export default function AdminPanel() {
    const router = useRouter();
    const [isAuthed, setIsAuthed] = useState(false);
    const [adminPass, setAdminPass] = useState("");

    const [newName, setNewName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [timeLeft, setTimeLeft] = useState<string | null>(null);

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

    const { data: globalState, refetch: refetchGlobal } = api.global.getState.useQuery(undefined, {
        enabled: isAuthed,
    });

    const toggleSimulation = api.admin.toggleSimulation.useMutation({
        onSuccess: () => {
            refetchGlobal();
        }
    });

    const toggleMainframeBreak = api.admin.toggleMainframeBreak.useMutation({
        onSuccess: () => {
            refetchGlobal();
        }
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (globalState?.isStarted && globalState.startedAt) {
            interval = setInterval(() => {
                const now = new Date().getTime();
                const start = new Date(globalState.startedAt!).getTime();
                const diff = (start + 2 * 60 * 60 * 1000) - now;

                if (diff <= 0) {
                    setTimeLeft("00:00:00");
                } else {
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);

                    setTimeLeft(
                        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                    );
                }
            }, 1000);
        } else {
            setTimeLeft(null);
        }

        return () => clearInterval(interval);
    }, [globalState]);

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
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <Shield className="text-amber-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">Admin Panel</h1>
                            <p className="text-xs text-slate-500">Locked In Reality</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Mainframe Break Control */}

                        {/* Simulation Control */}
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 mr-2">
                            {globalState?.isStarted ? (
                                <>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-emerald-400 font-bold tracking-wider">SIMULATION RUNNING</span>
                                        <span className="text-xs font-mono font-bold text-white">{timeLeft ?? "00:00:00"}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm("Stop simulation? This freezes the current timer and locks out teams!")) {
                                                toggleSimulation.mutate({ adminPassword: adminPass, start: false });
                                            }
                                        }}
                                        disabled={toggleSimulation.isPending}
                                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-1.5 rounded-md transition-colors"
                                        title="Stop Simulation"
                                    >
                                        {toggleSimulation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs text-rose-400 font-bold tracking-wider">SIMULATION STOPPED</span>
                                    <button
                                        onClick={() => {
                                            if (confirm("Start simulation? This will begin the 2 hour countdown immediately!")) {
                                                toggleSimulation.mutate({ adminPassword: adminPass, start: true });
                                            }
                                        }}
                                        disabled={toggleSimulation.isPending}
                                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-xs font-bold"
                                    >
                                        {toggleSimulation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                        START
                                    </button>
                                </>
                            )}
                        </div>

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
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end gap-0.5 min-w-[80px]">
                                                <div className="flex items-center gap-1 text-yellow-500 text-xs font-mono font-bold">
                                                    <Trophy size={11} />
                                                    {team.score}
                                                </div>
                                                {team.finishedAt && (
                                                    <span className="text-[10px] text-emerald-500 font-mono opacity-80">
                                                        {new Date(team.finishedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete team "${team.name}"?`)) {
                                                        deleteTeam.mutate({ adminPassword: adminPass, teamId: team.id });
                                                    }
                                                }}
                                                className="opacity-60 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-rose-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-600 text-sm text-center py-8">No teams yet.</p>
                        )}
                    </div>
                    <div>

                        <div className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 mr-2">
                            <div className="flex flex-col gap-1">
                                <span className={`text-[10px] font-bold tracking-wider ${globalState?.isMainframeBreakActive ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                                    MAINFRAME EVENT
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-row gap-2">
                                        <p>Time: </p>
                                        <input
                                            type="number"
                                            title="Duration (mins)"
                                            placeholder="Min"
                                            className="w-10 bg-black border border-slate-700 text-sm py-1 px-2 rounded no-spinner"
                                            defaultValue={globalState?.mainframeBreakDurationMins ?? 15}
                                            id="mb-duration"
                                        /></div>
                                    <div className="flex flex-row gap-2">
                                        <p>Number of cubes: </p>
                                        <input
                                            type="number"
                                            title="Correct Ans"
                                            placeholder="Ans"
                                            className="w-10 bg-black border border-slate-700 text-sm py-1 px-2 rounded no-spinner"
                                            defaultValue={globalState?.mainframeBreakCorrectValue ?? 14}
                                            id="mb-answer"
                                        /></div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const active = !globalState?.isMainframeBreakActive;
                                    const dur = parseInt((document.getElementById('mb-duration') as HTMLInputElement).value);
                                    const ans = parseInt((document.getElementById('mb-answer') as HTMLInputElement).value);
                                    if (confirm(`${active ? 'Start' : 'Stop'} Mainframe Break event?`)) {
                                        toggleMainframeBreak.mutate({
                                            adminPassword: adminPass,
                                            active,
                                            durationMins: dur,
                                            correctValue: ans
                                        });
                                    }
                                }}
                                disabled={toggleMainframeBreak.isPending}
                                className={`${globalState?.isMainframeBreakActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'} px-3 py-1.5 rounded-md transition-colors text-[10px] font-bold`}
                            >
                                {toggleMainframeBreak.isPending ? <Loader2 size={12} className="animate-spin" /> : (globalState?.isMainframeBreakActive ? 'STOP' : 'BREAK SERVER')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main >
    );
}
