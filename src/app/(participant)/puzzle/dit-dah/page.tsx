"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import Link from "next/link";

const UNIT = 300; // ms

type SequenceItem = { isOn: boolean; durationMs: number };

function buildMorseSequence(): SequenceItem[] {
    const words = "LOOK UNDER KEYBOARD".split(" ");
    const morseMap: Record<string, string> = {
        L: ".-..", O: "---", K: "-.-", U: "..-", N: "-.", D: "-..", E: ".", R: ".-.", Y: "-.--", B: "-...", A: ".-"
    };

    const seq: SequenceItem[] = [];

    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        for (let l = 0; l < word.length; l++) {
            const letter = word[l];
            const morse = morseMap[letter];
            if (!morse) continue;

            for (let m = 0; m < morse.length; m++) {
                const char = morse[m];
                seq.push({ isOn: true, durationMs: (char === "." ? 1 : 3) * UNIT });

                if (m < morse.length - 1) {
                    seq.push({ isOn: false, durationMs: 1 * UNIT });
                }
            }

            if (l < word.length - 1) {
                seq.push({ isOn: false, durationMs: 3 * UNIT });
            }
        }

        if (w < words.length - 1) {
            seq.push({ isOn: false, durationMs: 7 * UNIT });
        }
    }

    return seq;
}

export default function DitDahPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [answer, setAnswer] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSolved, setIsSolved] = useState(false);

    const [isLightOn, setIsLightOn] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const sequenceRef = useRef(buildMorseSequence());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isPlayingRef = useRef(false);

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

    const puzzle = puzzles?.find((p) => p.id === "dit-dah");

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
                setAnswer("");
            }
        },
        onError: () => {
            setErrorMsg("Something went wrong. Please try again.");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!teamId || !puzzle) return;
        if (!answer.trim()) return;

        submitAnswer.mutate({
            teamId,
            puzzleId: puzzle.id,
            answer: answer.trim()
        });
    };

    const playSequence = () => {
        if (isSolved || isPlaying) return;

        setIsPlaying(true);
        isPlayingRef.current = true;
        let currentIndex = 0;
        const seq = sequenceRef.current;

        const nextStep = () => {
            if (!isPlayingRef.current) return;

            if (currentIndex >= seq.length) {
                // stop after one cycle
                isPlayingRef.current = false;
                setIsPlaying(false);
                setIsLightOn(false);
                return;
            }

            const step = seq[currentIndex];
            setIsLightOn(step.isOn);
            timeoutRef.current = setTimeout(() => {
                currentIndex++;
                nextStep();
            }, step.durationMs);
        };

        nextStep();
    };

    useEffect(() => {
        if (isSolved) {
            setIsLightOn(true);
            isPlayingRef.current = false;
            setIsPlaying(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        return () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSolved]);

    const handleAction = () => {
        if (isPlaying) {
            // Stop the sequence
            isPlayingRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setIsLightOn(false);
            setIsPlaying(false);
        } else {
            // Start the sequence
            playSequence();
        }
    };

    if (puzzlesLoading || !teamId) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        );
    }

    if (!puzzle && !puzzlesLoading) {
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
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-3xl">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={16} /> Back
                    </Link>

                    {!isSolved && (
                        <div className="flex flex-col items-center justify-center space-y-6 my-8">
                            <div className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-200 ${isLightOn ? 'bg-yellow-400/20 shadow-[0_0_60px_20px_rgba(250,204,21,0.3)]' : 'bg-slate-800'}`}>
                                <Lightbulb
                                    size={64}
                                    className={`transition-all duration-200 ${isLightOn ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleAction}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {isPlaying ? "Restart" : "Start"}
                            </button>
                        </div>
                    )}
                </div>

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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-yellow-500 rounded-xl px-5 py-4 text-white font-mono text-center tracking-widest focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all uppercase"
                                required
                                placeholder="ENTER ANSWER..."
                            />
                        </div>

                        {errorMsg && (
                            <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                {errorMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitAnswer.isPending || !answer.trim()}
                            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitAnswer.isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                "Submit Solution"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}