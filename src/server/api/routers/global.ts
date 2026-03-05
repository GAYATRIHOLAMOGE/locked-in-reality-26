import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const globalRouter = createTRPCRouter({
    getState: publicProcedure.query(async ({ ctx }) => {
        let state = await ctx.db.globalState.findUnique({
            where: { id: "global" },
        });

        if (!state) {
            state = await ctx.db.globalState.create({
                data: {
                    id: "global",
                    isStarted: false,
                    startedAt: null,
                },
            });
        }

        return state;
    }),
});
