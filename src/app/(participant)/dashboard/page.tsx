"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";
import { LogOut, Loader2, Trophy, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem("teamId");
        const name = localStorage.getItem("teamName");
        if (!id) {
            router.push("/pakka-real-login");
        } else {
            setTeamId(id);
            setTeamName(name);
        }
    }, [router]);

    const { data: team, isLoading, refetch } = api.puzzle.getTeamStatus.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const { data: puzzles, isLoading: isLoadingPuzzles } = api.puzzle.getPuzzles.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const handleLogout = () => {
        localStorage.removeItem("teamId");
        localStorage.removeItem("teamName");
        router.push("/pakka-real-login");
    };

    if (!teamId || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[url('/afraid.jpg')] bg-cover bg-center bg-fixed">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[url('/afraid.jpg')] bg-cover bg-center bg-fixed text-white flex-col gap-4">
                <p className="text-slate-400">Session invalid. Please login again.</p>
                <button onClick={handleLogout} className="text-violet-400 hover:underline text-sm">
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 bg-[url('/afraid.jpg')] bg-cover bg-center bg-fixed text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo" width={100} height={40} />
                        <div className="h-6 w-px bg-gray-400 mx-1" />
                        <span className="font-mono text-slate-400 text-sm">
                            TEAM: <span className="text-white font-bold">{team.name}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-4 py-1.5 text-sm">
                            <Trophy size={13} className="text-yellow-400" />
                            <span className="font-mono font-bold text-yellow-300">{team.score}</span>
                            <span className="text-slate-500 text-xs">PTS</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                            title="Logout"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {isLoadingPuzzles ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-violet-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {puzzles?.map((puzzle, index) => (
                            <div
                                key={puzzle.id}
                                className={`relative group overflow-hidden rounded-2xl border ${puzzle.solved ? 'border-green-500/30 bg-green-500/5' : 'border-slate-800/80 bg-slate-900/50'} backdrop-blur-md p-5 transition-all hover:border-violet-500/50 block`}
                            >
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 font-mono text-lg font-bold text-slate-300">
                                                {puzzle.order ? puzzle.order : index + 1}
                                            </div>
                                            {puzzle.solved && (
                                                <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                    <CheckCircle2 size={12} />
                                                    Solved
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Reward</div>
                                            <div className="text-sm font-bold text-yellow-500">{puzzle.points} pts</div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-8 tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
                                        {puzzle.name}
                                    </h3>

                                    <div className="mt-auto pt-4 border-t border-slate-800/80 group-hover:border-violet-500/30 transition-colors">
                                        <Link
                                            href={`/puzzle/${puzzle.id}`}
                                            className="flex items-center justify-between w-full group/btn"
                                        >
                                            <span className="text-sm font-medium text-slate-300 group-hover/btn:text-white transition-colors">
                                                {puzzle.solved ? "Review" : "Enter Puzzle"}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 group-hover/btn:bg-violet-600 group-hover/btn:text-white transition-all transform group-hover/btn:translate-x-1">
                                                <Play size={14} className="ml-0.5" fill="currentColor" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
