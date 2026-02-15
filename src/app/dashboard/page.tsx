"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import QuizInterface from "@/components/QuizInterface";
import PuzzleInterface from "@/components/PuzzleInterface";
import { LogOut, Loader2, Trophy } from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem("teamId");
        if (!id) {
            router.push("/");
        } else {
            setTeamId(id);
        }
    }, [router]);

    const { data: team, isLoading, refetch } = api.quiz.getTeamStatus.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const handleLogout = () => {
        localStorage.removeItem("teamId");
        localStorage.removeItem("teamName");
        router.push("/");
    };

    if (!teamId || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <Loader2 className="animate-spin text-violet-500" size={48} />
            </div>
        );
    }

    if (!team) {
        // Handle case where ID exists but team is gone (db reset)
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white flex-col gap-4">
                <p>Session invalid. Please login again.</p>
                <button onClick={handleLogout} className="text-violet-400 underline">Back to Home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 font-black text-xl tracking-tighter">
                            LOCKED_IN_REALITY
                        </span>
                        <div className="h-6 w-px bg-slate-700 mx-2" />
                        <span className="font-mono text-slate-400">TEAM: <span className="text-white font-bold">{team.name}</span></span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 py-1 text-sm border border-slate-700">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="font-mono">{team.score} PTS</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                            title="Disconnect"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {team.currentRound === 1 && (
                    <QuizInterface teamId={team.id} teamLevel={team.currentLevel} />
                )}

                {team.currentRound === 2 && (
                    <PuzzleInterface teamId={team.id} />
                )}
            </main>
        </div>
    );
}
