import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const PUZZLES = [
    {
        id: "secret-salad",
        slug: "secret-salad",
        name: "Secret Salad",
        solution: "I CAME, I SAW, I CONQUERED",
        hint: "",
        hintCost: 10,
        points: 40,
        order: 1,
    },
    {
        id: "case-order",
        slug: "case-order",
        name: "Case Order",
        solution: "312105",
        hint: "Fibonacci sequence",
        hintCost: 10,
        points: 40,
        order: 2,
    },
    {
        id: "dit-dah",
        slug: "dit-dah",
        name: "Dit Dah",
        solution: "LOOK UNDER KEYBOARD",
        hint: "Morse Code",
        hintCost: 10,
        points: 40,
        order: 3,
    },
];

export const puzzleRouter = createTRPCRouter({
    getPuzzles: publicProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ ctx, input }) => {
            const puzzleStatuses = await ctx.db.teamPuzzleStatus.findMany({
                where: { teamId: input.teamId }
            });

            const solvedSet = new Set(puzzleStatuses.filter(s => s.isSolved).map(s => s.puzzleSlug));
            const hintSet = new Set(puzzleStatuses.filter(s => s.isHintTaken).map(s => s.puzzleSlug));

            return PUZZLES.map((p) => ({
                id: p.slug, // Use slug as ID for compatibility
                name: p.name,
                points: p.points,
                hintCost: p.hintCost,
                order: p.order,
                solved: solvedSet.has(p.slug),
                hintUsed: hintSet.has(p.slug),
                hintText: hintSet.has(p.slug) ? p.hint : null,
            }));
        }),

    submitPuzzle: publicProcedure
        .input(
            z.object({
                teamId: z.string(),
                puzzleId: z.string(), // This will now be the slug
                answer: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const puzzle = PUZZLES.find(p => p.slug === input.puzzleId);

            if (!puzzle) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Puzzle not found",
                });
            }

            // Check if already solved
            const status = await ctx.db.teamPuzzleStatus.findUnique({
                where: {
                    teamId_puzzleSlug: {
                        teamId: input.teamId,
                        puzzleSlug: input.puzzleId,
                    }
                }
            });

            if (status?.isSolved) {
                return { status: "ALREADY_SOLVED", message: "Already solved!" };
            }

            const isCorrect =
                puzzle.solution.toLowerCase().trim() ===
                input.answer.toLowerCase().trim();

            if (isCorrect) {
                await ctx.db.teamPuzzleStatus.upsert({
                    where: {
                        teamId_puzzleSlug: {
                            teamId: input.teamId,
                            puzzleSlug: input.puzzleId,
                        }
                    },
                    update: {
                        isSolved: true,
                        solvedAt: new Date(),
                    },
                    create: {
                        teamId: input.teamId,
                        puzzleSlug: input.puzzleId,
                        isSolved: true,
                        solvedAt: new Date(),
                    }
                });
            }

            if (isCorrect) {
                await ctx.db.team.update({
                    where: { id: input.teamId },
                    data: { score: { increment: puzzle.points } },
                });
                return { status: "CORRECT", message: `Puzzle solved! +${puzzle.points} pts` };
            } else {
                return { status: "WRONG", message: "Incorrect solution. Try again." };
            }
        }),

    useHint: publicProcedure
        .input(z.object({ teamId: z.string(), puzzleId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const puzzle = PUZZLES.find(p => p.slug === input.puzzleId);

            if (!puzzle) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Puzzle not found",
                });
            }

            // Check if hint already used
            const status = await ctx.db.teamPuzzleStatus.findUnique({
                where: {
                    teamId_puzzleSlug: {
                        teamId: input.teamId,
                        puzzleSlug: input.puzzleId,
                    }
                }
            });

            if (status?.isHintTaken) {
                return {
                    hintText: puzzle.hint,
                    hintCost: 0,
                    alreadyUsed: true,
                };
            }

            await ctx.db.teamPuzzleStatus.upsert({
                where: {
                    teamId_puzzleSlug: {
                        teamId: input.teamId,
                        puzzleSlug: input.puzzleId,
                    }
                },
                update: { isHintTaken: true },
                create: {
                    teamId: input.teamId,
                    puzzleSlug: input.puzzleId,
                    isHintTaken: true,
                }
            });

            // Deduct hintCost (don't go below 0)
            const team = await ctx.db.team.findUnique({
                where: { id: input.teamId },
            });
            const newScore = Math.max(0, (team?.score ?? 0) - puzzle.hintCost);
            await ctx.db.team.update({
                where: { id: input.teamId },
                data: { score: newScore },
            });

            return {
                hintText: puzzle.hint,
                hintCost: puzzle.hintCost,
                alreadyUsed: false,
            };
        }),

    getTeamStatus: publicProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.team.findUnique({
                where: { id: input.teamId },
                select: {
                    id: true,
                    name: true,
                    score: true,
                },
            });
        }),
});
