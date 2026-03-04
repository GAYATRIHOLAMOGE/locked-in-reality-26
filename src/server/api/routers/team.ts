import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
    login: publicProcedure
        .input(z.object({ name: z.string(), password: z.string() }))
        .mutation(async ({ ctx, input }) => {
            try {
                const team = await ctx.db.team.findFirst({
                    where: { name: input.name },
                });

                if (!team) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "team not found",
                    });
                }

                if (team.password !== input.password) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "invalid password",
                    });
                }

                return { id: team.id, name: team.name };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "something went wrong",
                });
            }
        }),
});
