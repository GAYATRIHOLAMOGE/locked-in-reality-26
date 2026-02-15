import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const quizRouter = createTRPCRouter({
    getQuestion: publicProcedure
        .input(z.object({ teamId: z.string(), level: z.number() }))
        .query(async ({ ctx, input }) => {
            // get questions for the level
            const questions = await ctx.db.question.findMany({
                where: { level: input.level },
                select: {
                    id: true,
                    content: true,
                    options: {
                        select: {
                            id: true,
                            content: true,
                        }
                    },
                    points: true,
                },
            });
            return questions;
        }),

    submitAnswer: publicProcedure
        .input(z.object({ teamId: z.string(), questionId: z.string(), optionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();

            // 1. Check Time Window
            const settings = await ctx.db.gameSettings.findUnique({ where: { id: "config" } });
            if (settings) {
                if (now < settings.round1Start) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Round 1 has not started yet." });
                }
                if (now > settings.round1End) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Round 1 has ended." });
                }
            }

            // 2. Validate Question
            const question = await ctx.db.question.findUnique({
                where: { id: input.questionId },
            });

            if (!question) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
            }

            // 3. Check Option
            const selectedOption = await ctx.db.option.findUnique({
                where: { id: input.optionId }
            });

            if (!selectedOption || selectedOption.questionId !== input.questionId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid option selected" });
            }

            // 4. Check Answer
            const isCorrect = selectedOption.isCorrect;

            // 5. Log Submission
            await ctx.db.submission.create({
                data: {
                    teamId: input.teamId,
                    questionId: input.questionId,
                    optionId: input.optionId,
                    isCorrect,
                },
            });

            if (isCorrect) {
                // Update Team Score
                await ctx.db.team.update({
                    where: { id: input.teamId },
                    data: { score: { increment: question.points } },
                });

                // Progression Logic
                // Provide logic to move to next level if all questions in current level are done.

                // Count total questions in this level
                const totalQuestions = await ctx.db.question.count({
                    where: { level: question.level }
                });

                // Count correct submissions for this team in this level
                // We check unique questionIds to ensure we don't count duplicate correct answers if allowed
                const correctSubmissions = await ctx.db.submission.count({
                    where: {
                        teamId: input.teamId,
                        isCorrect: true,
                        question: { level: question.level }
                    }
                });

                // Note: The above count might double count if user submits twice correctly (if allowed), 
                // but usually we move them on immediately. A more robust way is to group by questionId.
                const correctQuestionsCount = (await ctx.db.submission.findMany({
                    where: {
                        teamId: input.teamId,
                        isCorrect: true,
                        question: { level: question.level }
                    },
                    distinct: ['questionId']
                })).length;

                const team = await ctx.db.team.findUnique({ where: { id: input.teamId } });
                let levelUp = false;

                if (correctQuestionsCount >= totalQuestions) {
                    // Level Completed!
                    if (question.level < 3) {
                        await ctx.db.team.update({
                            where: { id: input.teamId },
                            data: { currentLevel: question.level + 1 }
                        });
                        levelUp = true;
                    } else {
                        // Round 1 Completed!
                        await ctx.db.team.update({
                            where: { id: input.teamId },
                            data: {
                                currentRound: 2,
                                currentLevel: 1, // Reset level for Round 2? Or just redundant.
                                round1CompletedAt: new Date()
                            }
                        });
                        levelUp = true;
                    }
                }

                return { status: "CORRECT", message: "Correct Answer!", levelUp };
            } else {
                return { status: "WRONG", message: "Incorrect Answer. Try again." };
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
                    currentRound: true,
                    currentLevel: true,
                    score: true,
                    round1CompletedAt: true,
                    round2CompletedAt: true
                }
            });
        })
});
