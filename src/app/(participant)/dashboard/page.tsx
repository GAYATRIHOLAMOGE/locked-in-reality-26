"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import PuzzleInterface from "@/components/PuzzleInterface";
import { LogOut, Loader2, Trophy, Cpu } from "lucide-react";

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

    const handleLogout = () => {
        localStorage.removeItem("teamId");
        localStorage.removeItem("teamName");
        router.push("/pakka-real-login");
    };

    if (!teamId || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white flex-col gap-4">
                <p className="text-slate-400">Session invalid. Please login again.</p>
                <button onClick={handleLogout} className="text-violet-400 hover:underline text-sm">
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Cpu size={18} className="text-violet-400" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-black text-lg tracking-tighter">
                            LOCKED_IN_REALITY
                        </span>
                        <div className="h-4 w-px bg-slate-700 mx-1" />
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
                            className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                            title="Logout"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-white tracking-tight">Puzzle Board</h2>
                    <p className="text-slate-500 text-sm mt-1">Solve puzzles to earn points. Use hints wisely — they cost you.</p>
                </div>
                <PuzzleInterface teamId={team.id} onScoreChange={refetch} />
            </main>
        </div>
    );
}
