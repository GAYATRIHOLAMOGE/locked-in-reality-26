import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
    register: publicProcedure
        .input(z.object({ name: z.string().min(3), password: z.string().min(4) }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.team.findUnique({
                where: { name: input.name },
            });
            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Team name already taken",
                });
            }

            const team = await ctx.db.team.create({
                data: {
                    name: input.name,
                    password: input.password, // In a real app, hash this!
                },
            });

            return { id: team.id, name: team.name };
        }),

    login: publicProcedure
        .input(z.object({ name: z.string(), password: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.team.findUnique({
                where: { name: input.name },
            });

            if (!team || team.password !== input.password) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid team name or password",
                });
            }

            return { id: team.id, name: team.name, round: team.currentRound };
        }),
});
