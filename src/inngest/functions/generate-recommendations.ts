import { inngest } from "../client";
import { db } from "@/lib/db";
import { generateRecommendations } from "@/lib/agents/recommendation-engine";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";

export const generateRecommendationsFn = inngest.createFunction(
  {
    id: "generate-recommendations",
    retries: 3,
    triggers: [{ event: "repos/scouted" }],
  },
  async ({ event, step }: { event: { data: { userId: string; scoutingRunId: string } }; step: any }) => {
    const { userId, scoutingRunId } = event.data;

    const { profile, candidates, accessToken } = await step.run(
      "load-data",
      async () => {
        const [devProfile, scoutingRun, account] = await Promise.all([
          db.developerProfile.findUnique({ where: { userId } }),
          db.scoutingRun.findUnique({
            where: { id: scoutingRunId },
            include: {
              candidateRepos: { orderBy: { matchScore: "desc" }, take: 15 },
            },
          }),
          db.account.findFirst({
            where: { userId, provider: "github" },
            select: { access_token: true },
          }),
        ]);

        if (!devProfile) throw new Error("Developer profile not found");
        if (!scoutingRun) throw new Error("Scouting run not found");
        if (!account?.access_token) throw new Error("No GitHub account linked");

        return {
          profile: devProfile.profile as unknown as DeveloperProfile,
          candidates: scoutingRun.candidateRepos.map(
            (c) => c.matchData as unknown as CandidateRepo
          ),
          accessToken: account.access_token,
        };
      }
    );

    if (candidates.length === 0) {
      return { success: true, count: 0 };
    }

    const result = await step.run("run-recommendation-engine", async () => {
      return generateRecommendations(profile, candidates, accessToken);
    });

    await step.run("save-recommendations", async () => {
      await db.recommendation.deleteMany({
        where: { userId, scoutingRunId },
      });

      if (result.recommendations.length > 0) {
        await db.recommendation.createMany({
          data: result.recommendations.map((rec: any) => ({
            userId,
            scoutingRunId,
            repoFullName: rec.repoFullName,
            data: JSON.parse(JSON.stringify(rec)),
          })),
        });
      }
    });

    await step.sendEvent("notify-complete", {
      name: "recommendations/generated",
      data: { userId, count: result.recommendations.length },
    });

    return {
      success: true,
      count: result.recommendations.length,
      modelUsed: result.modelUsed,
    };
  }
);
