import { z } from "zod";
import { type Puzzle } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const puzzleRouter = createTRPCRouter({
    getPuzzles: publicProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ ctx, input }) => {
            const puzzles = await ctx.db.puzzle.findMany();

            // Get solved status for each puzzle
            const solvedIds = await ctx.db.submission.findMany({
                where: {
                    teamId: input.teamId,
                    isCorrect: true,
                    puzzleId: { not: null }
                },
                select: { puzzleId: true }
            });

            const solvedSet = new Set(solvedIds.map((s: { puzzleId: string | null }) => s.puzzleId));

            return puzzles.map((p: Puzzle) => ({
                ...p,
                solved: solvedSet.has(p.id),
                solution: undefined // Hide solution
            }));
        }),

    submitPuzzle: publicProcedure
        .input(z.object({ teamId: z.string(), puzzleId: z.string(), answer: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();

            // 1. Check Time Window
            const settings = await ctx.db.gameSettings.findUnique({ where: { id: "config" } });
            if (settings) {
                if (now < settings.round2Start) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Round 2 has not started yet." });
                }
                if (now > settings.round2End) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Round 2 has ended." });
                }
            }

            // 2. Validate Puzzle
            const puzzle = await ctx.db.puzzle.findUnique({
                where: { id: input.puzzleId },
            });

            if (!puzzle) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Puzzle not found" });
            }

            // 3. Check Answer
            const isCorrect = puzzle.solution.toLowerCase().trim() === input.answer.toLowerCase().trim();

            // 4. Log Submission
            await ctx.db.submission.create({
                data: {
                    teamId: input.teamId,
                    puzzleId: input.puzzleId,
                    answer: input.answer,
                    isCorrect,
                },
            });

            if (isCorrect) {
                // Update Score
                await ctx.db.team.update({
                    where: { id: input.teamId },
                    data: { score: { increment: puzzle.points } },
                });

                // Check if all puzzles are solved
                const totalPuzzles = await ctx.db.puzzle.count();
                const solvedCount = await ctx.db.submission.count({
                    where: {
                        teamId: input.teamId,
                        isCorrect: true,
                        puzzleId: { not: null }
                    }
                });

                // If this was the last one (total - 1 before this one, specifically distinctive count)
                // Distinct count is safer
                const solvedDistinct = await ctx.db.submission.findMany({
                    where: {
                        teamId: input.teamId,
                        isCorrect: true,
                        puzzleId: { not: null }
                    },
                    distinct: ['puzzleId']
                });

                if (solvedDistinct.length >= totalPuzzles) {
                    // Round 2 Completed!
                    await ctx.db.team.update({
                        where: { id: input.teamId },
                        data: { round2CompletedAt: new Date() }
                    });
                }

                return { status: "CORRECT", message: "Puzzle Solved!" };
            } else {
                return { status: "WRONG", message: "Incorrect Solution." };
            }
        }),
});
