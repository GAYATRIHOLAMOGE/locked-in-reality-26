"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
    Loader2, CheckCircle, Lock, Unlock, Send, Lightbulb, AlertTriangle, X
} from "lucide-react";

interface PuzzleInterfaceProps {
    teamId: string;
    onScoreChange?: () => void;
}

interface HintModalProps {
    puzzleName: string;
    hintCost: number;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

function HintModal({ puzzleName, hintCost, onConfirm, onCancel, loading }: HintModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="text-amber-400" size={20} />
                    </div>
                    <h3 className="font-bold text-white">Use Hint?</h3>
                    <button onClick={onCancel} className="ml-auto text-slate-600 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-slate-400 text-sm mb-5">
                    Using a hint for <span className="text-white font-semibold">{puzzleName}</span> will cost you{" "}
                    <span className="text-amber-400 font-bold">{hintCost} pts</span>. This cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                        Use Hint
                    </button>
                </div>
            </div>
        </div>
    );
}

type PuzzleCardData = {
    id: string;
    name: string;
    description: string;
    points: number;
    hintCost: number;
    order: number;
    solved: boolean;
    hintUsed: boolean;
    hintText: string | null;
};

export default function PuzzleInterface({ teamId, onScoreChange }: PuzzleInterfaceProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, { status: "CORRECT" | "WRONG" | "ALREADY_SOLVED"; message: string }>>({});
    const [hintModal, setHintModal] = useState<{ puzzleId: string; puzzleName: string; hintCost: number } | null>(null);

    const { data: puzzles, isLoading, refetch } = api.puzzle.getPuzzles.useQuery(
        { teamId },
        { refetchOnWindowFocus: false }
    );

    const submitMutation = api.puzzle.submitPuzzle.useMutation({
        onSuccess: (data, variables) => {
            setFeedback((prev) => ({
                ...prev,
                [variables.puzzleId]: { status: data.status as "CORRECT" | "WRONG", message: data.message },
            }));
            if (data.status === "CORRECT") {
                refetch();
                onScoreChange?.();
            }
        },
        onError: (error, variables) => {
            setFeedback((prev) => ({
                ...prev,
                [variables.puzzleId]: { status: "WRONG", message: error.message },
            }));
        },
    });

    const hintMutation = api.puzzle.useHint.useMutation({
        onSuccess: () => {
            setHintModal(null);
            refetch();
            onScoreChange?.();
        },
        onError: () => setHintModal(null),
    });

    const handleAnswerChange = (puzzleId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [puzzleId]: value }));
        if (feedback[puzzleId]) {
            setFeedback((prev) => {
                const copy = { ...prev };
                delete copy[puzzleId];
                return copy;
            });
        }
    };

    const handleSubmit = (puzzleId: string) => {
        const answer = answers[puzzleId];
        if (!answer?.trim()) return;
        submitMutation.mutate({ teamId, puzzleId, answer });
    };

    const handleHintConfirm = () => {
        if (!hintModal) return;
        hintMutation.mutate({ teamId, puzzleId: hintModal.puzzleId });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="animate-spin text-violet-500" size={36} />
            </div>
        );
    }

    if (!puzzles || puzzles.length === 0) {
        return (
            <div className="text-center py-24 text-slate-500">
                <Lock size={40} className="mx-auto mb-4 text-slate-700" />
                <p>No puzzles available yet. Check back soon.</p>
            </div>
        );
    }

    const solved = puzzles.filter((p) => p.solved).length;

    return (
        <>
            {hintModal && (
                <HintModal
                    puzzleName={hintModal.puzzleName}
                    hintCost={hintModal.hintCost}
                    onConfirm={handleHintConfirm}
                    onCancel={() => setHintModal(null)}
                    loading={hintMutation.isPending}
                />
            )}

            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>{solved} of {puzzles.length} solved</span>
                    <span>{Math.round((solved / puzzles.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                        style={{ width: `${(solved / puzzles.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {puzzles.map((puzzle: PuzzleCardData) => {
                    const fb = feedback[puzzle.id];
                    const isSubmitting = submitMutation.isPending && submitMutation.variables?.puzzleId === puzzle.id;

                    return (
                        <div
                            key={puzzle.id}
                            className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${puzzle.solved
                                    ? "bg-emerald-950/20 border-emerald-500/25 shadow-lg shadow-emerald-900/10"
                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                }`}
                        >
                            {/* Top bar */}
                            <div className={`h-1 w-full ${puzzle.solved ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-violet-600 to-fuchsia-600"}`} />

                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${puzzle.solved ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                                            {puzzle.solved ? <Unlock size={17} /> : <Lock size={17} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm leading-tight">{puzzle.name}</h3>
                                            <span className={`text-xs font-mono font-bold ${puzzle.solved ? "text-emerald-400" : "text-violet-400"}`}>
                                                {puzzle.points} pts
                                            </span>
                                        </div>
                                    </div>
                                    {puzzle.solved && (
                                        <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-slate-400 text-sm mb-5 leading-relaxed">{puzzle.description}</p>

                                {/* Hint section */}
                                {puzzle.hintUsed && puzzle.hintText ? (
                                    <div className="mb-4 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1.5">
                                            <Lightbulb size={12} />
                                            HINT (−{puzzle.hintCost} pts)
                                        </div>
                                        <p className="text-amber-200/80 text-xs leading-relaxed">{puzzle.hintText}</p>
                                    </div>
                                ) : !puzzle.solved ? (
                                    <button
                                        onClick={() => setHintModal({ puzzleId: puzzle.id, puzzleName: puzzle.name, hintCost: puzzle.hintCost })}
                                        className="w-full mb-4 flex items-center justify-center gap-1.5 text-xs text-amber-500/70 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/30 rounded-xl py-2 transition-all"
                                    >
                                        <Lightbulb size={12} />
                                        Use Hint (−{puzzle.hintCost} pts)
                                    </button>
                                ) : null}

                                {/* Submission area */}
                                {puzzle.solved ? (
                                    <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
                                        <CheckCircle size={15} />
                                        SOLVED (+{puzzle.points} PTS)
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        <input
                                            type="text"
                                            placeholder="Enter your solution..."
                                            value={answers[puzzle.id] ?? ""}
                                            onChange={(e) => handleAnswerChange(puzzle.id, e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit(puzzle.id)}
                                            className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/40 placeholder:text-slate-600 transition-all"
                                            disabled={isSubmitting}
                                        />

                                        {fb && (
                                            <p className={`text-xs px-1 ${fb.status === "CORRECT" ? "text-emerald-400" : "text-rose-400"}`}>
                                                {fb.message}
                                            </p>
                                        )}

                                        <button
                                            onClick={() => handleSubmit(puzzle.id)}
                                            disabled={isSubmitting || !answers[puzzle.id]?.trim()}
                                            className="w-full bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="animate-spin" size={15} />
                                            ) : (
                                                <>
                                                    <Send size={13} />
                                                    Submit
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
