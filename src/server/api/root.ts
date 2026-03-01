import { puzzleRouter } from "@/server/api/routers/puzzle";
import { teamRouter } from "@/server/api/routers/team";
import { adminRouter } from "@/server/api/routers/admin";
import { createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    team: teamRouter,
    puzzle: puzzleRouter,
    admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
