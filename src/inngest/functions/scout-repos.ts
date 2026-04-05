import { inngest } from "../client";
import { db } from "@/lib/db";
import { scoutRepos } from "@/lib/agents/repo-scout";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";

export const scoutReposFn = inngest.createFunction(
  {
    id: "scout-repos",
    retries: 3,
    triggers: [{ event: "profile/analyzed" }],
  },
  async ({ event, step }: { event: { data: { userId: string } }; step: any }) => {
    const { userId } = event.data;

    const { profile, accessToken, username } = await step.run(
      "load-profile-and-token",
      async () => {
        const [devProfile, account, ghProfile] = await Promise.all([
          db.developerProfile.findUnique({ where: { userId } }),
          db.account.findFirst({
            where: { userId, provider: "github" },
            select: { access_token: true },
          }),
          db.gitHubProfile.findUnique({
            where: { userId },
            select: { username: true },
          }),
        ]);

        if (!devProfile) throw new Error("Developer profile not found");
        if (!account?.access_token) throw new Error("No GitHub account linked");
        if (!ghProfile) throw new Error("GitHub profile not found");

        return {
          profile: devProfile.profile as unknown as DeveloperProfile,
          accessToken: account.access_token,
          username: ghProfile.username,
        };
      }
    );

    const run = await step.run("create-scouting-run", async () => {
      return db.scoutingRun.create({
        data: { userId, status: "running", startedAt: new Date() },
      });
    });

    const result = await step.run("run-repo-scout", async () => {
      return scoutRepos(profile, accessToken, username);
    });

    await step.run("save-scouting-results", async () => {
      if (result.candidates.length > 0) {
        await db.candidateRepo.createMany({
          data: result.candidates.map((c: any) => ({
            scoutingRunId: run.id,
            repoFullName: c.repoFullName,
            url: c.url,
            matchScore: c.matchScore,
            matchData: JSON.parse(JSON.stringify(c)),
          })),
        });
      }

      await db.scoutingRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          queriesUsed: result.queriesUsed,
          reposScanned: result.reposScanned,
          modelUsed: result.modelUsed,
          durationMs: result.durationMs,
          completedAt: new Date(),
        },
      });
    });

    await step.sendEvent("trigger-recommendations", {
      name: "repos/scouted",
      data: { userId, scoutingRunId: run.id },
    });

    return {
      success: true,
      candidateCount: result.candidates.length,
      reposScanned: result.reposScanned,
    };
  }
);
