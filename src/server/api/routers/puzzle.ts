import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const PUZZLES = [
    {
        id: "bit-gate",
        slug: "bit-gate",
        name: "Bit Gate",
        solution: "LOCKED",
        points: 20,
        order: 1,
    },
    {
        id: "from-origin",
        slug: "from-origin",
        name: "From Origin",
        solution: "3,9 and 9,14",
        points: 20,
        order: 2,
    },
    {
        id: "secret-salad",
        slug: "secret-salad",
        name: "Secret Salad",
        solution: "I CAME, I SAW, I CONQUERED",
        points: 30,
        order: 3,
    },
    {
        id: "dit-dah",
        slug: "dit-dah",
        name: "Dit Dah",
        solution: "KEYBOARD",
        points: 40,
        order: 4,
    },
    {
        id: "case-order",
        slug: "case-order",
        name: "Case Order",
        solution: "312105",
        points: 40,
        order: 5,
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

            return PUZZLES.map((p) => ({
                id: p.slug, // Use slug as ID for compatibility
                name: p.name,
                points: p.points,
                order: p.order,
                solved: solvedSet.has(p.slug),
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
