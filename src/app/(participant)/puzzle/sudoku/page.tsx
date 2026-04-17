"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";

const PREFILLED = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

const initialCells: string[] = PREFILLED.split("").map(c => (c === "0" ? "" : c));

export default function SudokuPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [grid, setGrid] = useState<string[]>(initialCells);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSolved, setIsSolved] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(81).fill(null));

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
            if (!globalState.isStarted) router.push("/");
            else if (globalState.isMainframeBreakActive) router.push("/265616b");
        }
    }, [globalState, router]);

    const { data: puzzles, isLoading: puzzlesLoading } = api.puzzle.getPuzzles.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const puzzle = puzzles?.find(p => p.id === "sudoku");

    useEffect(() => {
        if (puzzle?.solved) setIsSolved(true);
    }, [puzzle]);

    const submitAnswer = api.puzzle.submitPuzzle.useMutation({
        onSuccess: (data) => {
            if (data.status === "CORRECT" || data.status === "ALREADY_SOLVED") {
                setIsSolved(true);
                setErrorMsg("");
            } else {
                setErrorMsg(data.message);
            }
        },
        onError: () => setErrorMsg("Something went wrong. Please try again."),
    });

    const handleCellChange = (index: number, value: string) => {
        const digit = value.replace(/[^1-9]/g, "").slice(-1);
        const newGrid = [...grid];
        newGrid[index] = digit;
        setGrid(newGrid);

        if (digit) {
            for (let i = index + 1; i <= 80; i++) {
                if (PREFILLED[i] === "0") {
                    inputRefs.current[i]?.focus();
                    break;
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace") {
            const newGrid = [...grid];
            newGrid[index] = "";
            setGrid(newGrid);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            for (let i = index + 1; i <= 80; i++) {
                if (PREFILLED[i] === "0") { inputRefs.current[i]?.focus(); break; }
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            for (let i = index - 1; i >= 0; i--) {
                if (PREFILLED[i] === "0") { inputRefs.current[i]?.focus(); break; }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!teamId || !puzzle) return;

        if (grid.includes("")) {
            setErrorMsg("Fill in all cells before submitting.");
            return;
        }

        submitAnswer.mutate({ teamId, puzzleId: puzzle.id, answer: grid.join("") });
    };

    const isComplete = !grid.includes("");

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
        <main className="min-h-screen relative flex items-center justify-center text-slate-200 overflow-hidden py-8">
            <div className="absolute inset-0 z-0 bg-slate-950" />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/30 via-slate-950 to-slate-950" />

            <PuzzleCard title={puzzle.name}>
                {isSolved ? (
                    <div className="text-center py-8 space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Solved!</h2>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex justify-center">
                            <div className="border-2 border-slate-400 grid grid-cols-9">
                                {grid.map((value, i) => {
                                    const row = Math.floor(i / 9);
                                    const col = i % 9;
                                    const isPrefilled = PREFILLED[i] !== "0";

                                    const borderRight = col !== 8
                                        ? col % 3 === 2
                                            ? "border-r-2 border-r-slate-400"
                                            : "border-r border-r-slate-600"
                                        : "";
                                    const borderBottom = row !== 8
                                        ? row % 3 === 2
                                            ? "border-b-2 border-b-slate-400"
                                            : "border-b border-b-slate-600"
                                        : "";

                                    return (
                                        <div
                                            key={i}
                                            className={`w-9 h-9 flex items-center justify-center ${borderRight} ${borderBottom} ${isPrefilled ? "bg-slate-800" : "bg-slate-900/60"}`}
                                        >
                                            {isPrefilled ? (
                                                <span className="text-sm font-bold text-slate-200 select-none">
                                                    {value}
                                                </span>
                                            ) : (
                                                <input
                                                    ref={el => { inputRefs.current[i] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={value}
                                                    onChange={e => handleCellChange(i, e.target.value)}
                                                    onKeyDown={e => handleKeyDown(i, e)}
                                                    className="w-full h-full text-center text-sm font-mono text-violet-300 bg-transparent focus:outline-none focus:bg-violet-950/50 transition-colors caret-transparent"
                                                    maxLength={1}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {errorMsg && (
                            <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                {errorMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitAnswer.isPending || !isComplete}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitAnswer.isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                "Submit Solution"
                            )}
                        </button>
                    </form>
                )}
            </PuzzleCard>
        </main>
    );
}
