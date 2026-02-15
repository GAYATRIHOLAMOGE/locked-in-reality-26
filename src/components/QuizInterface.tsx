"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuizInterfaceProps {
    teamId: string;
    teamLevel: number;
}

export default function QuizInterface({ teamId, teamLevel }: QuizInterfaceProps) {
    const router = useRouter();
    const [selectedOptionId, setSelectedOptionId] = useState<string>("");
    const [feedback, setFeedback] = useState<{ status: "CORRECT" | "WRONG"; message: string } | null>(null);

    const { data: questions, isLoading, refetch } = api.quiz.getQuestion.useQuery(
        { teamId, level: teamLevel },
        { refetchOnWindowFocus: false }
    );

    const submitMutation = api.quiz.submitAnswer.useMutation({
        onSuccess: (data) => {
            setFeedback({ status: data.status as "CORRECT" | "WRONG", message: data.message });
            if (data.status === "CORRECT") {
                setSelectedOptionId("");
                refetch();
                if (data.levelUp) {
                    router.refresh(); // Refresh to update team level in parent
                }
            }
        },
        onError: (error) => {
            setFeedback({ status: "WRONG", message: error.message });
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                No questions found for this level. Please contact support.
            </div>
        );
    }

    const currentQuestion = questions[0]; // Assuming one question per level based on router logic

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOptionId) return;
        setFeedback(null);
        submitMutation.mutate({
            teamId,
            questionId: currentQuestion.id,
            optionId: selectedOptionId
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
                <div className="mb-6">
                    <span className="text-xs font-mono text-violet-400 border border-violet-500/30 px-2 py-1 rounded">
                        LEVEL {teamLevel}
                    </span>
                    <h2 className="text-2xl font-bold mt-4 text-white">
                        {currentQuestion.content}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={option.id}
                            onClick={() => setSelectedOptionId(option.id)}
                            className={`p-4 rounded-lg text-left transition-all border ${selectedOptionId === option.id
                                ? "bg-violet-500/20 border-violet-500 text-white"
                                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600"
                                }`}
                        >
                            <span className="font-mono opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {option.content}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="relative">
                    {feedback && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${feedback.status === "CORRECT"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                            {feedback.status === "CORRECT" ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            <span>{feedback.message}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitMutation.isPending || !selectedOptionId}
                        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Submit Answer</span>
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
