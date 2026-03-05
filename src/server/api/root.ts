import { puzzleRouter } from "@/server/api/routers/puzzle";
import { teamRouter } from "@/server/api/routers/team";
import { adminRouter } from "@/server/api/routers/admin";
import { createTRPCRouter } from "@/server/api/trpc";

import { globalRouter } from "@/server/api/routers/global";

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    team: teamRouter,
    puzzle: puzzleRouter,
    admin: adminRouter,
    global: globalRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
