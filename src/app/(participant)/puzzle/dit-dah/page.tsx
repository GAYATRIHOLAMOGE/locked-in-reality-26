"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";

const UNIT = 300;

const ACTUAL_ANSWER_WORD = "KEYB";
const COMPANION_WORDS = ["BOLT", "FIRE", "WIND", "ROCK"];

type SequenceItem = { isOn: boolean; durationMs: number };

function buildMorseSequence(word: string): SequenceItem[] {
    const letters = word.toUpperCase().split("");
    const morseMap: Record<string, string> = {
        A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".",
        F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
        K: "-.-", L: ".-..", M: "--", N: "-.", O: "---",
        P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
        U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.."
    };

    const seq: SequenceItem[] = [];

    for (let l = 0; l < letters.length; l++) {
        const letter = letters[l];
        const morse = morseMap[letter];
        if (!morse) continue;

        for (let m = 0; m < morse.length; m++) {
            const char = morse[m];
            seq.push({ isOn: true, durationMs: (char === "." ? 1 : 3) * UNIT });

            if (m < morse.length - 1) {
                seq.push({ isOn: false, durationMs: 1 * UNIT });
            }
        }

        if (l < letters.length - 1) {
            seq.push({ isOn: false, durationMs: 3 * UNIT });
        }
    }

    seq.push({ isOn: false, durationMs: 7 * UNIT });
    return seq;
}

export default function DitDahPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [answer, setAnswer] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSolved, setIsSolved] = useState(false);

    const [lights, setLights] = useState<boolean[]>([false, false, false, false]);
    const [isPlaying, setIsPlaying] = useState(false);

    const words = [
        COMPANION_WORDS[0]!,
        COMPANION_WORDS[1]!,
        ACTUAL_ANSWER_WORD,
        COMPANION_WORDS[2]!
    ];

    const sequencesRef = useRef(words.map(buildMorseSequence));
    const timeoutsRef = useRef<(NodeJS.Timeout | null)[]>([null, null, null, null]);
    const mainTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isPlayingRef = useRef(false);

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
        setLights([false, false, false, false]);

        sequencesRef.current.forEach((seq, bulbIndex) => {
            let currentIndex = 0;

            const nextStep = () => {
                if (!isPlayingRef.current) return;

                if (currentIndex >= seq.length) {
                    setLights(prev => {
                        const newLights = [...prev];
                        if (newLights.length > bulbIndex) newLights[bulbIndex] = false;
                        return newLights;
                    });
                    return;
                }

                const step = seq[currentIndex];
                setLights(prev => {
                    const newState = [...prev];
                    if (newState.length > bulbIndex) newState[bulbIndex] = step.isOn;
                    return newState;
                });

                timeoutsRef.current[bulbIndex] = setTimeout(() => {
                    currentIndex++;
                    nextStep();
                }, step.durationMs);
            };

            nextStep();
        });

        const maxDuration = Math.max(...sequencesRef.current.map(seq =>
            seq.reduce((acc, curr) => acc + curr.durationMs, 0)
        ));

        mainTimeoutRef.current = setTimeout(() => {
            if (isPlayingRef.current) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                setLights([false, false, false, false]);
            }
        }, maxDuration + 100);
    };

    useEffect(() => {
        if (isSolved) {
            setLights([true, true, true, true]);
            isPlayingRef.current = false;
            setIsPlaying(false);
            timeoutsRef.current.forEach(t => {
                if (t) clearTimeout(t);
            });
            if (mainTimeoutRef.current) clearTimeout(mainTimeoutRef.current);
            return;
        }

        return () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            timeoutsRef.current.forEach(t => {
                if (t) clearTimeout(t);
            });
            if (mainTimeoutRef.current) clearTimeout(mainTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSolved]);

    const handleAction = () => {
        if (isPlaying) {
            isPlayingRef.current = false;
            timeoutsRef.current.forEach(t => {
                if (t) clearTimeout(t);
            });
            timeoutsRef.current = [null, null, null, null];
            if (mainTimeoutRef.current) {
                clearTimeout(mainTimeoutRef.current);
                mainTimeoutRef.current = null;
            }
            setLights([false, false, false, false]);
            setIsPlaying(false);
        } else {
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

            <PuzzleCard title={puzzle?.name ?? ""}>
                {!isSolved && (
                    <div className="flex flex-col items-center justify-center space-y-6 my-6">
                        <div className="flex flex-row w-full items-center justify-center gap-12 md:gap-16">
                            {lights.map((isOn, i) => (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-100 ${isOn ? 'bg-yellow-400 shadow-[0_0_15px_5px_rgba(250,204,21,0.6)]' : 'bg-slate-800'}`} />
                                    <span className="text-slate-500 font-mono text-xs">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAction}
                            className="flex items-center text-sm text-slate-400 border border-slate-800 rounded-full px-4 py-2 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {isPlaying ? "Stop" : "Start"}
                        </button>

                        <p className="text-slate-300 font-medium text-center text-lg md:text-xl">
                            The one true answer is to the North of WE
                        </p>

                    </div>
                )}

                {isSolved ? (
                    <div className="text-center py-8 space-y-6">
                        <div className="flex justify-center gap-12 md:gap-16 mb-8">
                            {lights.map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_5px_rgba(250,204,21,0.6)]`} />
                            ))}
                        </div>
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
            </PuzzleCard>
        </main>
    );
}