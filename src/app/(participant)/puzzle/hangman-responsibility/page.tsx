"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";

const WORD = "RESPONSIBILITY";
const MAX_WRONG = 6;

const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
];

// ─── Hangman SVG ──────────────────────────────────────────────────────────────
// Gallows always visible. Body parts appear one per wrong guess:
//   1→head  2→body  3→left arm  4→right arm  5→left leg  6→right leg
function HangmanDrawing({ wrongCount }: { wrongCount: number }) {
    const s = { stroke: "#94a3b8", strokeWidth: 2, strokeLinecap: "round" as const };
    return (
        <svg
            viewBox="0 0 150 160"
            className="w-full max-w-[160px] h-auto mx-auto"
            aria-label={`Hangman: ${wrongCount} of ${MAX_WRONG} wrong guesses`}
        >
            {/* Gallows */}
            <line x1="10" y1="150" x2="140" y2="150" {...s} />  {/* base */}
            <line x1="30"  y1="150" x2="30"  y2="5"   {...s} />  {/* pole */}
            <line x1="30"  y1="5"   x2="100" y2="5"   {...s} />  {/* beam */}
            <line x1="100" y1="5"   x2="100" y2="25"  {...s} />  {/* rope */}

            {/* Head */}
            {wrongCount >= 1 && (
                <circle cx="100" cy="37" r="12" stroke="#94a3b8" strokeWidth="2" fill="none" />
            )}
            {/* Body */}
            {wrongCount >= 2 && <line x1="100" y1="49"  x2="100" y2="98"  {...s} />}
            {/* Left arm */}
            {wrongCount >= 3 && <line x1="100" y1="64"  x2="74"  y2="84"  {...s} />}
            {/* Right arm */}
            {wrongCount >= 4 && <line x1="100" y1="64"  x2="126" y2="84"  {...s} />}
            {/* Left leg */}
            {wrongCount >= 5 && <line x1="100" y1="98"  x2="76"  y2="128" {...s} />}
            {/* Right leg */}
            {wrongCount >= 6 && <line x1="100" y1="98"  x2="124" y2="128" {...s} />}
        </svg>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HangmanPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [isSolved, setIsSolved] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());

    // ── Auth & global state ───────────────────────────────────────────────────
    useEffect(() => {
        const id = localStorage.getItem("teamId");
        if (!id) router.push("/pakka-real-login-trust-me");
        else setTeamId(id);
    }, [router]);

    const { data: globalState } = api.global.getState.useQuery();
    useEffect(() => {
        if (globalState) {
            if (!globalState.isStarted) router.push("/");
            else if (globalState.isMainframeBreakActive) router.push("/265616b");
        }
    }, [globalState, router]);

    // ── Puzzle data ───────────────────────────────────────────────────────────
    const { data: puzzles, isLoading: puzzlesLoading } = api.puzzle.getPuzzles.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );
    const puzzle = puzzles?.find(p => p.id === "hangman-responsibility");

    useEffect(() => {
        if (puzzle?.solved) setIsSolved(true);
    }, [puzzle]);

    // ── Submission ────────────────────────────────────────────────────────────
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!teamId || !puzzle) return;
        // Always submit the word — backend validates for points
        submitAnswer.mutate({ teamId, puzzleId: puzzle.id, answer: WORD });
    };

    // ── Game logic ────────────────────────────────────────────────────────────
    const wordLetters = WORD.split("");
    const uniqueLetters = [...new Set(wordLetters)];
    const wrongCount = [...guessedLetters].filter(l => !WORD.includes(l)).length;
    const isWon = uniqueLetters.every(l => guessedLetters.has(l));
    const isLost = wrongCount >= MAX_WRONG;
    const isGameOver = isWon || isLost;

    const handleGuess = useCallback(
        (letter: string) => {
            if (guessedLetters.has(letter) || isGameOver) return;
            setGuessedLetters(prev => new Set([...prev, letter]));
        },
        [guessedLetters, isGameOver]
    );

    // Physical keyboard
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const letter = e.key.toUpperCase();
            if (/^[A-Z]$/.test(letter)) handleGuess(letter);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleGuess]);

    // ── Loading / error screens ───────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen relative flex items-center justify-center text-slate-200 overflow-hidden py-8">
            <div className="absolute inset-0 z-0 bg-slate-950" />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/30 via-slate-950 to-slate-950" />

            <PuzzleCard title={puzzle.name}>
                {isSolved ? (
                    /* ── Already submitted & correct ── */
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

                        {/* ── Hangman drawing ── */}
                        <HangmanDrawing wrongCount={wrongCount} />

                        {/* ── Wrong guess counter ── */}
                        <p className="text-center font-mono text-xs text-slate-500">
                            Wrong guesses:{" "}
                            <span className={
                                wrongCount >= MAX_WRONG ? "text-rose-400 font-bold" :
                                wrongCount > 0         ? "text-amber-400 font-semibold" :
                                                         "text-slate-300"
                            }>
                                {wrongCount}
                            </span>
                            {" / "}{MAX_WRONG}
                        </p>

                        {/* ── Word slots ── */}
                        <div className="flex justify-center gap-1 flex-nowrap">
                            {wordLetters.map((letter, i) => {
                                const guessed = guessedLetters.has(letter);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-0.5">
                                        {/* Letter — text-transparent keeps consistent slot width */}
                                        <span className={`w-5 text-center text-sm font-bold font-mono transition-colors ${
                                            guessed ? "text-white"     :
                                            isLost  ? "text-rose-400"  :
                                                      "text-transparent"
                                        }`}>
                                            {letter}
                                        </span>
                                        {/* Underline — green when correctly guessed */}
                                        <div className={`w-5 h-0.5 rounded-full transition-colors ${
                                            guessed ? "bg-green-500" : "bg-slate-600"
                                        }`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Win / Loss banner ── */}
                        {isGameOver && (
                            <div className={`text-center text-xs font-semibold px-3 py-2.5 rounded-lg ${
                                isWon
                                    ? "text-green-300 bg-green-500/10 border border-green-500/20"
                                    : "text-rose-300  bg-rose-500/10  border border-rose-500/20"
                            }`}>
                                {isWon
                                    ? `Well done! The word was ${WORD}`
                                    : `Game over! The word was ${WORD}`}
                            </div>
                        )}

                        {/* ── On-screen keyboard ── */}
                        <div className="space-y-1.5">
                            {KEYBOARD_ROWS.map((row, ri) => (
                                <div key={ri} className="flex justify-center gap-1">
                                    {row.map(letter => {
                                        const isCorrectGuess = guessedLetters.has(letter) && WORD.includes(letter);
                                        const isWrongGuess   = guessedLetters.has(letter) && !WORD.includes(letter);
                                        const isGuessed      = guessedLetters.has(letter);
                                        return (
                                            <button
                                                key={letter}
                                                type="button"
                                                onClick={() => handleGuess(letter)}
                                                disabled={isGuessed || isGameOver}
                                                className={[
                                                    "w-7 h-8 rounded text-[11px] font-bold font-mono transition-all select-none",
                                                    isCorrectGuess
                                                        ? "bg-green-700/70 text-green-200 cursor-not-allowed"
                                                        : isWrongGuess
                                                        ? "bg-rose-900/60 text-rose-500 cursor-not-allowed opacity-50"
                                                        : isGameOver
                                                        ? "bg-slate-800/60 text-slate-600 cursor-not-allowed"
                                                        : "bg-slate-700 hover:bg-slate-500 active:scale-95 text-slate-200",
                                                ].join(" ")}
                                            >
                                                {letter}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {errorMsg && (
                            <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                {errorMsg}
                            </p>
                        )}

                        {/* ── Submit button — only shown after game ends ── */}
                        {isGameOver && (
                            <button
                                type="submit"
                                disabled={submitAnswer.isPending}
                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {submitAnswer.isPending
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : "Submit Answer"
                                }
                            </button>
                        )}
                    </form>
                )}
            </PuzzleCard>
        </main>
    );
}
