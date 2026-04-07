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
  async ({ event, step }: { event: { data: { userId: string; scoutingRunId?: string } }; step: any }) => {
    const { userId, scoutingRunId } = event.data;

    const { profile, accessToken, username, settings } = await step.run(
      "load-profile-and-token",
      async () => {
        const [devProfile, account, ghProfile, userSettings] =
          await Promise.all([
            db.developerProfile.findUnique({ where: { userId } }),
            db.account.findFirst({
              where: { userId, provider: "github" },
              select: { access_token: true },
            }),
            db.gitHubProfile.findUnique({
              where: { userId },
              select: { username: true },
            }),
            db.userSettings.findUnique({ where: { userId } }),
          ]);

        if (!devProfile) throw new Error("Developer profile not found");
        if (!account?.access_token) throw new Error("No GitHub account linked");
        if (!ghProfile) throw new Error("GitHub profile not found");

        return {
          profile: devProfile.profile as unknown as DeveloperProfile,
          accessToken: account.access_token,
          username: ghProfile.username,
          settings: userSettings
            ? {
                minStars: userSettings.minStars,
                excludedRepos: userSettings.excludedRepos,
                excludedTopics: userSettings.excludedTopics,
              }
            : undefined,
        };
      }
    );

    // Use existing scouting run (created at pipeline start) or create one
    const run = await step.run("get-or-create-scouting-run", async () => {
      if (scoutingRunId) {
        const existing = await db.scoutingRun.update({
          where: { id: scoutingRunId },
          data: { status: "running" },
        });
        return existing;
      }
      return db.scoutingRun.create({
        data: { userId, status: "running", startedAt: new Date() },
      });
    });

    const result = await step.run("run-repo-scout", async () => {
      return scoutRepos(profile, accessToken, username, {
        filterOptions: settings,
      });
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
