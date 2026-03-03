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
});
