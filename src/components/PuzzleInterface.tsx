"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, CheckCircle, Lock, Unlock, Send } from "lucide-react";

interface PuzzleInterfaceProps {
    teamId: string;
}

export default function PuzzleInterface({ teamId }: PuzzleInterfaceProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, { status: "CORRECT" | "WRONG"; message: string }>>({});

    const { data: puzzles, isLoading, refetch } = api.puzzle.getPuzzles.useQuery(
        { teamId },
        { refetchOnWindowFocus: false }
    );

    const submitMutation = api.puzzle.submitPuzzle.useMutation({
        onSuccess: (data, variables) => {
            setFeedback((prev) => ({
                ...prev,
                [variables.puzzleId]: { status: data.status as "CORRECT" | "WRONG", message: data.message }
            }));
            if (data.status === "CORRECT") {
                refetch();
            }
        },
        onError: (error, variables) => {
            setFeedback((prev) => ({
                ...prev,
                [variables.puzzleId]: { status: "WRONG", message: error.message }
            }));
        }
    });

    const handleAnswerChange = (puzzleId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [puzzleId]: value }));
        // Clear feedback when typing
        if (feedback[puzzleId]) {
            setFeedback((prev) => {
                const newFeedback = { ...prev };
                delete newFeedback[puzzleId];
                return newFeedback;
            });
        }
    };

    const handleSubmit = (puzzleId: string) => {
        const answer = answers[puzzleId];
        if (!answer?.trim()) return;

        submitMutation.mutate({
            teamId,
            puzzleId,
            answer
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
        );
    }

    if (!puzzles || puzzles.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                No puzzles available at the moment.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {puzzles.map((puzzle: any) => (
                <div
                    key={puzzle.id}
                    className={`relative overflow-hidden rounded-xl border ${puzzle.solved
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-slate-900/50 border-slate-800"
                        }`}
                >
                    {puzzle.solved && (
                        <div className="absolute top-4 right-4 text-emerald-500">
                            <CheckCircle size={24} />
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${puzzle.solved ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"}`}>
                                {puzzle.solved ? <Unlock size={20} /> : <Lock size={20} />}
                            </div>
                            <h3 className="font-bold text-lg text-white">Puzzle {puzzle.order}</h3>
                        </div>

                        <div className="prose prose-invert prose-sm mb-6">
                            <p className="text-slate-300">{puzzle.content}</p>
                            {/* If content is markdown or html, we might need a parser, but assuming text for now */}
                        </div>

                        <div className="mt-auto">
                            {puzzle.solved ? (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium text-center">
                                    SOLVED (+{puzzle.points} PTS)
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Enter solution..."
                                        value={answers[puzzle.id] || ""}
                                        onChange={(e) => handleAnswerChange(puzzle.id, e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-1 focus:ring-violet-500 outline-none"
                                        disabled={submitMutation.isPending}
                                    />

                                    {feedback[puzzle.id] && feedback[puzzle.id].status === "WRONG" && (
                                        <div className="text-xs text-rose-400 px-1">
                                            {feedback[puzzle.id].message}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleSubmit(puzzle.id)}
                                        disabled={submitMutation.isPending || !answers[puzzle.id]}
                                        className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitMutation.isPending && submitMutation.variables?.puzzleId === puzzle.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <>
                                                <span>Submit</span>
                                                <Send size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
