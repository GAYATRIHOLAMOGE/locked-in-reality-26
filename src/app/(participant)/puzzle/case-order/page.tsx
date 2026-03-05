"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";

export default function AureaSectioPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [answers, setAnswers] = useState(["", "", "", "", "", ""]);
    // Using traditional refs array for better control
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const [errorMsg, setErrorMsg] = useState("");
    const [isSolved, setIsSolved] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("teamId");
        if (!id) {
            router.push("/pakka-real-login-trust-me");
        } else {
            setTeamId(id);
        }
    }, [router]);

    const { data: globalState } = api.global.getState.useQuery();

    useEffect(() => {
        if (globalState) {
            if (!globalState.isStarted) {
                router.push("/");
            } else if (globalState.isMainframeBreakActive) {
                router.push("/265616b");
            }
        }
    }, [globalState, router]);

    const { data: puzzles, isLoading: puzzlesLoading } = api.puzzle.getPuzzles.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const puzzle = puzzles?.find(p => p.id === "case-order"); // Using the ID which backend sets to slug

    useEffect(() => {
        if (puzzle?.solved) {
            setIsSolved(true);
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
                setAnswers(["", "", "", "", "", ""]);
                refs.current[0]?.focus();
            }
        },
        onError: () => {
            setErrorMsg("Something went wrong. Please try again.");
        }
    });

    const handleInputChange = (index: number, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, "").slice(-1);
        if (!numericValue && value !== "") return;

        const newAnswers = [...answers];
        newAnswers[index] = numericValue;
        setAnswers(newAnswers);

        // Auto focus next
        if (numericValue && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !answers[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!teamId || !puzzle) return;

        const fullAnswer = answers.join("");
        if (fullAnswer.length < 6) return;

        submitAnswer.mutate({
            teamId,
            puzzleId: puzzle.id,
            answer: fullAnswer
        });
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
        <main className="min-h-screen relative flex items-center justify-center text-slate-200 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/fibonacci.jpg')" }}
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

            <PuzzleCard title={puzzle.name}>
                <p className="text-slate-200 text-md mb-2"> Nature grows forward. This case is a bit different.</p>

                {isSolved ? (
                    <div className="text-center py-8 space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Solved!</h2>
                        </div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors mt-4"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-6 gap-3">
                                {answers.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            refs.current[idx] = el;
                                        }}
                                        type="text"
                                        value={digit}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-full bg-slate-900 border-2 border-slate-700 focus:border-yellow-500 rounded-xl py-4 text-white font-mono text-center text-xl focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all"
                                        inputMode="numeric"
                                        maxLength={1}
                                        required
                                    />
                                ))}
                            </div>

                            {errorMsg && (
                                <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                    {errorMsg}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitAnswer.isPending || answers.some(d => !d)}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {submitAnswer.isPending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    "Submit Sequence"
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </PuzzleCard>
        </main>
    );
}
