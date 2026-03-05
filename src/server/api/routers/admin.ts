import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const adminRouter = createTRPCRouter({
    verifyPassword: publicProcedure
        .input(z.object({ adminPassword: z.string() }))
        .mutation(async ({ input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }
            return { success: true };
        }),

    createTeam: publicProcedure
        .input(
            z.object({
                adminPassword: z.string(),
                name: z.string().min(2),
                password: z.string().min(4),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }

            const existing = await ctx.db.team.findUnique({
                where: { name: input.name },
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Team name already exists",
                });
            }

            const team = await ctx.db.team.create({
                data: {
                    name: input.name,
                    password: input.password,
                },
            });

            return { id: team.id, name: team.name };
        }),

    listTeams: publicProcedure
        .input(z.object({ adminPassword: z.string() }))
        .query(async ({ ctx, input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }

            return ctx.db.team.findMany({
                select: {
                    id: true,
                    name: true,
                    score: true,
                    createdAt: true,
                },
                orderBy: { score: "desc" },
            });
        }),

    deleteTeam: publicProcedure
        .input(z.object({ adminPassword: z.string(), teamId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }

            // Delete puzzle statuses first
            await ctx.db.teamPuzzleStatus.deleteMany({
                where: { teamId: input.teamId },
            });

            await ctx.db.team.delete({
                where: { id: input.teamId },
            });

            return { success: true };
        }),

    toggleSimulation: publicProcedure
        .input(z.object({ adminPassword: z.string(), start: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }

            const state = await ctx.db.globalState.upsert({
                where: { id: "global" },
                update: {
                    isStarted: input.start,
                    startedAt: input.start ? new Date() : null,
                },
                create: {
                    id: "global",
                    isStarted: input.start,
                    startedAt: input.start ? new Date() : null,
                },
            });

            return state;
        }),

    toggleMainframeBreak: publicProcedure
        .input(
            z.object({
                adminPassword: z.string(),
                active: z.boolean(),
                durationMins: z.number().optional(),
                correctValue: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.adminPassword !== ADMIN_PASSWORD) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid admin password",
                });
            }

            const state = await ctx.db.globalState.upsert({
                where: { id: "global" },
                update: {
                    isMainframeBreakActive: input.active,
                    mainframeBreakStartedAt: input.active ? new Date() : null,
                    ...(input.durationMins !== undefined
                        ? { mainframeBreakDurationMins: input.durationMins }
                        : {}),
                    ...(input.correctValue !== undefined
                        ? { mainframeBreakCorrectValue: input.correctValue }
                        : {}),
                },
                create: {
                    id: "global",
                    isMainframeBreakActive: input.active,
                    mainframeBreakStartedAt: input.active ? new Date() : null,
                    mainframeBreakDurationMins: input.durationMins ?? 15,
                    mainframeBreakCorrectValue: input.correctValue ?? 14,
                },
            });

            // Reset team submission status if break is started
            if (input.active) {
                await ctx.db.team.updateMany({
                    data: { hasSubmittedMainframe: false }
                });
            }

            return state;
        }),

    submitMainframeBreak: publicProcedure
        .input(
            z.object({
                teamId: z.string(),
                value: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.team.findUnique({
                where: { id: input.teamId },
            });

            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (team.hasSubmittedMainframe) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Bypassing protocols detected: Access denied. (Only one attempt allowed)",
                });
            }

            const state = await ctx.db.globalState.findUnique({
                where: { id: "global" },
            });

            if (!state?.isMainframeBreakActive || !state.mainframeBreakStartedAt) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Mainframe break is not active",
                });
            }

            const now = new Date();
            const end = new Date(state.mainframeBreakStartedAt.getTime() + state.mainframeBreakDurationMins * 60 * 1000);

            if (now < end) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Timer has not ended yet",
                });
            }

            // Points logic:
            // correct: 20
            // 1 less: 15
            // 2 less: 10
            // 3 less: 5
            // more than correct: 0
            const diff = state.mainframeBreakCorrectValue - input.value;
            let points = 0;
            if (diff === 0) points = 20;
            else if (diff === 1) points = 15;
            else if (diff === 2) points = 10;
            else if (diff === 3) points = 5;

            const updatedTeam = await ctx.db.team.update({
                where: { id: input.teamId },
                data: {
                    score: { increment: points },
                    hasSubmittedMainframe: true,
                },
            });

            return { success: true, points, newScore: updatedTeam.score };
        }),
});
