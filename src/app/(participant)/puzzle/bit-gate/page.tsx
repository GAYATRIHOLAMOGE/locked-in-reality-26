"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";
import Image from "next/image";

// 403 in binary is 110010011 (9 bits)
const TARGET_SEQUENCE = [true, true, false, false, true, false, false, true, true];

export default function BitGatePuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [switches, setSwitches] = useState<boolean[]>(Array(9).fill(false));
    const [isSolved, setIsSolved] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const id = localStorage.getItem("teamId");
        if (!id) {
            router.push("/pakka-real-login-trust-me");
        } else {
            setTeamId(id);
        }
    }, [router]);

    const { data: puzzles, isLoading: puzzlesLoading } = api.puzzle.getPuzzles.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const puzzle = puzzles?.find((p) => p.id === "bit-gate");

    useEffect(() => {
        if (puzzle?.solved) {
            setIsSolved(true);
            setSwitches(TARGET_SEQUENCE);
        }
    }, [puzzle]);

    const submitAnswer = api.puzzle.submitPuzzle.useMutation({
        onSuccess: (data) => {
            if (data.status === "CORRECT") {
                setIsSolved(true);
                setErrorMsg("");
            } else if (data.status === "ALREADY_SOLVED") {
                setIsSolved(true);
            } else {
                setErrorMsg(data.message);
            }
        },
        onError: () => {
            setErrorMsg("Something went wrong. Please try again.");
        }
    });

    const toggleSwitch = (index: number) => {
        if (isSolved || submitAnswer.isPending) return;

        const newSwitches = [...switches];
        newSwitches[index] = !newSwitches[index];
        setSwitches(newSwitches);

        // Check if matches 403 in binary
        const isMatch = newSwitches.every((val, i) => val === TARGET_SEQUENCE[i]);
        if (isMatch && teamId && puzzle) {
            submitAnswer.mutate({
                teamId,
                puzzleId: puzzle.id,
                answer: "LOCKED"
            });
        }
    };

    if (puzzlesLoading || !teamId) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white flex-col gap-4">
                <p className="text-rose-400">Puzzle not found or not available.</p>
                <Link href="/dashboard" className="text-violet-400 hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen relative flex items-center justify-center text-slate-200 overflow-hidden bg-slate-950">
            <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

            <div className="z-10 w-full max-w-lg">
                <PuzzleCard title={puzzle?.name ?? "Bit Gate"}>
                    <div className="relative flex flex-col items-center justify-center space-y-8 w-full">

                        {submitAnswer.isPending && (
                            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md rounded-xl flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 size={40} className="animate-spin text-green-500" />
                                    <p className="text-green-400 font-mono animate-pulse tracking-widest text-sm">SECURING GATE...</p>
                                </div>
                            </div>
                        )}

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-medium text-slate-300">Lock the door to prevent access</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Enter the lock sequence</p>
                        </div>

                        <div className="relative w-full h-24 flex justify-center items-center">
                            {isSolved ? (
                                <Image
                                    src="/door-closed.png"
                                    alt="Closed Door"
                                    width={90}
                                    height={120}
                                    className="object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-500"
                                />
                            ) : (
                                <Image
                                    src="/door-open.png"
                                    alt="Open Door"
                                    width={90}
                                    height={120}
                                    className="object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-500"
                                />
                            )}
                        </div>

                        {!isSolved && (
                            <div className="flex flex-col gap-2 w-full mt-4">
                                {/* The 9 switches arranged nicely */}
                                <div className="grid grid-cols-9 gap-2">
                                    {switches.map((isOn, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => toggleSwitch(idx)}
                                            className={`h-full w-full py-1 rounded-md md:rounded-lg transition-all duration-300 border-2 flex flex-col items-center justify-center gap-2
                                                ${isOn
                                                    ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                                    : 'bg-red-500/10 border-red-900/50 shadow-inner'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 
                                                ${isOn ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-red-900/40'}
                                            `} />
                                            <span className={`text-[10px] sm:text-xs font-mono font-bold ${isOn ? 'text-green-300' : 'text-slate-600'}`}>
                                                {isOn ? '1' : '0'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between w-full mt-1 px-1">
                                    <span className="text-[10px] text-slate-500 font-mono tracking-widest">MSB</span>
                                    <span className="text-[10px] text-slate-500 font-mono tracking-widest">LSB</span>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                {errorMsg}
                            </p>
                        )}

                        {isSolved && (
                            <div className="text-center py-4 space-y-6 w-full animate-in fade-in zoom-in duration-500">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={32} className="text-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2 tracking-wide font-mono">ACCESS SECURED</h2>
                                </div>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 hover:ring-2 hover:ring-slate-500 text-white font-bold py-3 rounded-xl transition-all mt-4"
                                >
                                    Return to Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                </PuzzleCard>
            </div>
        </main>
    );
}
