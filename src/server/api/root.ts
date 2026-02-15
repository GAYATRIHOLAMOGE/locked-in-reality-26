import { quizRouter } from "@/server/api/routers/quiz";
import { puzzleRouter } from "@/server/api/routers/puzzle";
import { createTRPCRouter } from "@/server/api/trpc";
import { teamRouter } from "./routers/team";
import { quizRouter as quizRouterRelative } from "./routers/quiz";
import { puzzleRouter as puzzleRouterRelative } from "./routers/puzzle";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    team: teamRouter,
    quiz: quizRouterRelative,
    puzzle: puzzleRouterRelative,
});

// export type definition of API
export type AppRouter = typeof appRouter;
