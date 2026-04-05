import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { syncGitHubData } from "@/inngest/functions/sync-github-data";
import { analyzeProfileFn } from "@/inngest/functions/analyze-profile";
import { scoutReposFn } from "@/inngest/functions/scout-repos";
import { generateRecommendationsFn } from "@/inngest/functions/generate-recommendations";
import { scheduledScout } from "@/inngest/functions/scheduled-scout";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncGitHubData,
    analyzeProfileFn,
    scoutReposFn,
    generateRecommendationsFn,
    scheduledScout,
  ],
});
