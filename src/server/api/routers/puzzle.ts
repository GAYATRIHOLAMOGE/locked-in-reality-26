import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const puzzleRouter = createTRPCRouter({
    getPuzzles: publicProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ ctx, input }) => {
            const puzzles = await ctx.db.puzzle.findMany({
                orderBy: { order: "asc" },
            });

            // Get correct submissions for this team
            const solvedSubmissions = await ctx.db.submission.findMany({
                where: {
                    teamId: input.teamId,
                    isCorrect: true,
                    isHint: false,
                    puzzleId: { not: null },
                },
                select: { puzzleId: true },
                distinct: ["puzzleId"],
            });

            // Get hint usages for this team
            const hintSubmissions = await ctx.db.submission.findMany({
                where: {
                    teamId: input.teamId,
                    isHint: true,
                    puzzleId: { not: null },
                },
                select: { puzzleId: true, answer: true },
                distinct: ["puzzleId"],
            });

            const solvedSet = new Set(solvedSubmissions.map((s) => s.puzzleId));
            const hintMap = new Map(
                hintSubmissions.map((s) => [s.puzzleId, s.answer])
            );

            return puzzles.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                points: p.points,
                hintCost: p.hintCost,
                order: p.order,
                solved: solvedSet.has(p.id),
                hintUsed: hintMap.has(p.id),
                hintText: hintMap.get(p.id) ?? null,
                // never send solution to client
            }));
        }),

    submitPuzzle: publicProcedure
        .input(
            z.object({
                teamId: z.string(),
                puzzleId: z.string(),
                answer: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const puzzle = await ctx.db.puzzle.findUnique({
                where: { id: input.puzzleId },
            });

            if (!puzzle) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Puzzle not found",
                });
            }

            // Check if already solved
            const alreadySolved = await ctx.db.submission.findFirst({
                where: {
                    teamId: input.teamId,
                    puzzleId: input.puzzleId,
                    isCorrect: true,
                    isHint: false,
                },
            });

            if (alreadySolved) {
                return { status: "ALREADY_SOLVED", message: "Already solved!" };
            }

            const isCorrect =
                puzzle.solution.toLowerCase().trim() ===
                input.answer.toLowerCase().trim();

            await ctx.db.submission.create({
                data: {
                    teamId: input.teamId,
                    puzzleId: input.puzzleId,
                    answer: input.answer,
                    isCorrect,
                    isHint: false,
                },
            });

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
            const puzzle = await ctx.db.puzzle.findUnique({
                where: { id: input.puzzleId },
            });

            if (!puzzle) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Puzzle not found",
                });
            }

            // Check if hint already used
            const alreadyHinted = await ctx.db.submission.findFirst({
                where: {
                    teamId: input.teamId,
                    puzzleId: input.puzzleId,
                    isHint: true,
                },
            });

            if (alreadyHinted) {
                return {
                    hintText: puzzle.hint,
                    hintCost: 0,
                    alreadyUsed: true,
                };
            }

            // Log hint usage and deduct points
            await ctx.db.submission.create({
                data: {
                    teamId: input.teamId,
                    puzzleId: input.puzzleId,
                    answer: puzzle.hint,
                    isCorrect: false,
                    isHint: true,
                },
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
