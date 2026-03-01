import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
    login: publicProcedure
        .input(z.object({ name: z.string(), password: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.team.findFirst({
                where: { name: input.name },
            });

            if (!team || team.password !== input.password) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid team name or password",
                });
            }

            return { id: team.id, name: team.name };
        }),
});
