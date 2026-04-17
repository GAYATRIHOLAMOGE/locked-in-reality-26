"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PuzzleCard } from "@/components/PuzzleCard";

// ─── Hardcoded 15×15 grid ─────────────────────────────────────────────────────
// Horizontal words: BRAZIL (r0,c0-5), CANADA (r2,c0-5), FRANCE (r4,c0-5),
//   GERMANY (r6,c0-6), MEXICO (r8,c0-5), RUSSIA (r10,c0-5), SPAIN (r12,c0-4)
// Vertical words:   INDIA (c8,r0-4), JAPAN (c10,r0-4), NIGERIA (c12,r0-6)
const GRID: string[][] = [
    ['B','R','A','Z','I','L','K','T','I','M','J','Q','N','W','P'],
    ['X','F','V','H','Q','U','D','E','N','O','A','C','I','Y','R'],
    ['C','A','N','A','D','A','P','B','D','Z','P','L','G','T','S'],
    ['W','Q','M','T','K','J','L','R','I','E','A','V','E','H','F'],
    ['F','R','A','N','C','E','G','X','A','O','N','U','R','K','B'],
    ['T','Y','P','O','U','H','V','W','C','D','B','S','I','X','M'],
    ['G','E','R','M','A','N','Y','K','Q','L','F','Z','A','W','J'],
    ['H','B','D','S','Z','R','C','U','V','P','T','E','N','Q','O'],
    ['M','E','X','I','C','O','F','J','K','B','Y','H','W','L','D'],
    ['A','V','K','T','H','W','B','Q','P','Z','D','R','X','C','N'],
    ['R','U','S','S','I','A','M','K','T','J','G','P','Y','O','W'],
    ['Z','Q','D','P','X','B','N','C','V','L','H','R','K','U','T'],
    ['S','P','A','I','N','F','Y','J','W','B','G','Q','M','E','V'],
    ['O','C','K','W','T','U','Z','D','H','X','M','B','L','R','A'],
    ['V','J','N','Y','R','Q','E','T','P','F','K','S','X','C','H'],
];

const WORDS = [
    'BRAZIL','CANADA','FRANCE','GERMANY',
    'INDIA','JAPAN','MEXICO','NIGERIA','RUSSIA','SPAIN',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cellKey(row: number, col: number) {
    return `${row},${col}`;
}

function getCellsBetween(
    a: { row: number; col: number },
    b: { row: number; col: number }
): { row: number; col: number }[] {
    if (a.row === b.row) {
        const lo = Math.min(a.col, b.col);
        const hi = Math.max(a.col, b.col);
        return Array.from({ length: hi - lo + 1 }, (_, i) => ({ row: a.row, col: lo + i }));
    }
    if (a.col === b.col) {
        const lo = Math.min(a.row, b.row);
        const hi = Math.max(a.row, b.row);
        return Array.from({ length: hi - lo + 1 }, (_, i) => ({ row: lo + i, col: a.col }));
    }
    return []; // diagonal — not valid
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WordSearchCountriesPuzzle() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [isSolved, setIsSolved] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Drag / selection state
    const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Found words
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

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
    const puzzle = puzzles?.find(p => p.id === "word-search-countries");

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
        if (!teamId || !puzzle || foundWords.length === 0) return;
        // Sort alphabetically → matches backend solution string exactly when all 10 are found
        submitAnswer.mutate({
            teamId,
            puzzleId: puzzle.id,
            answer: [...foundWords].sort().join(","),
        });
    };

    // ── Selection logic ───────────────────────────────────────────────────────
    const finalizeSelection = useCallback(
        (start: { row: number; col: number }, end: { row: number; col: number }) => {
            const cells = getCellsBetween(start, end);
            if (cells.length < 2) return;
            const word = cells.map(c => GRID[c.row][c.col]).join("");
            if (WORDS.includes(word)) {
                setFoundWords(prev => (prev.includes(word) ? prev : [...prev, word]));
                setFoundCells(prev => {
                    const next = new Set(prev);
                    cells.forEach(c => next.add(cellKey(c.row, c.col)));
                    return next;
                });
            }
        },
        []
    );

    // Global mouseup so releasing outside the grid still finalises the drag
    useEffect(() => {
        const onMouseUp = () => {
            if (isDragging && dragStart && dragEnd) {
                finalizeSelection(dragStart, dragEnd);
            }
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
        };
        window.addEventListener("mouseup", onMouseUp);
        return () => window.removeEventListener("mouseup", onMouseUp);
    }, [isDragging, dragStart, dragEnd, finalizeSelection]);

    const handleMouseDown = (row: number, col: number) => {
        setDragStart({ row, col });
        setDragEnd({ row, col });
        setIsDragging(true);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isDragging) setDragEnd({ row, col });
    };

    // Cells in the current in-progress drag (for yellow highlight)
    const activeCells = new Set<string>();
    if (isDragging && dragStart && dragEnd) {
        getCellsBetween(dragStart, dragEnd).forEach(c => activeCells.add(cellKey(c.row, c.col)));
    }

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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Found counter */}
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-mono text-sm">
                                {foundWords.length} / {WORDS.length} found
                            </span>
                            {foundWords.length === WORDS.length && (
                                <span className="text-green-400 text-xs font-semibold animate-pulse">
                                    All found! Submit now ↓
                                </span>
                            )}
                        </div>

                        {/* Grid — cells fixed at 22 px so all 15 fit inside PuzzleCard */}
                        <div className="flex justify-center">
                        <div
                            className="select-none border border-slate-600"
                            style={{ userSelect: "none" }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(15, 22px)",
                                    gridTemplateRows: "repeat(15, 22px)",
                                }}
                            >
                                {GRID.map((row, r) =>
                                    row.map((letter, c) => {
                                        const key = cellKey(r, c);
                                        const isFound = foundCells.has(key);
                                        const isActive = activeCells.has(key) && !isFound;

                                        return (
                                            <div
                                                key={key}
                                                onMouseDown={() => handleMouseDown(r, c)}
                                                onMouseEnter={() => handleMouseEnter(r, c)}
                                                style={{ width: 22, height: 22 }}
                                                className={[
                                                    "flex items-center justify-center",
                                                    "text-[11px] font-bold font-mono cursor-pointer",
                                                    "border border-slate-700/30",
                                                    "transition-colors duration-75",
                                                    isFound
                                                        ? "bg-green-500/30 text-green-300"
                                                        : isActive
                                                        ? "bg-yellow-400/30 text-yellow-200"
                                                        : "text-slate-300 hover:bg-slate-700/40",
                                                ].join(" ")}
                                            >
                                                {letter}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        </div>

                        {/* Word list — 2 columns */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {WORDS.map(word => {
                                const found = foundWords.includes(word);
                                return (
                                    <div
                                        key={word}
                                        className={[
                                            "flex items-center gap-1.5 text-xs font-mono transition-all",
                                            found ? "text-green-400 line-through" : "text-slate-400",
                                        ].join(" ")}
                                    >
                                        <span className={`text-[10px] ${found ? "text-green-400" : "text-slate-600"}`}>
                                            {found ? "✓" : "○"}
                                        </span>
                                        {word}
                                    </div>
                                );
                            })}
                        </div>

                        {errorMsg && (
                            <p className="text-rose-400 text-sm text-center font-medium animate-pulse">
                                {errorMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitAnswer.isPending || foundWords.length === 0}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitAnswer.isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : foundWords.length === WORDS.length ? (
                                "Submit All Words"
                            ) : (
                                `Submit (${foundWords.length} / ${WORDS.length} found)`
                            )}
                        </button>
                    </form>
                )}
            </PuzzleCard>
        </main>
    );
}
