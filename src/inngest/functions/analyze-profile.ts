import { inngest } from "../client";
import { db } from "@/lib/db";
import { analyzeProfile } from "@/lib/agents/profile-analyzer";
import type { GitHubProfileData } from "@/lib/github/types";

export const analyzeProfileFn = inngest.createFunction(
  {
    id: "analyze-profile",
    retries: 3,
    triggers: [{ event: "github/sync.completed" }],
  },
  async ({ event, step }: { event: { data: { userId: string } }; step: any }) => {
    const { userId } = event.data;

    const githubProfile = await step.run("load-github-profile", async () => {
      const profile = await db.gitHubProfile.findUnique({ where: { userId } });
      if (!profile) throw new Error("GitHub profile not found");
      return profile;
    });

    const result = await step.run("run-profile-analysis", async () => {
      const profileData: GitHubProfileData = {
        username: githubProfile.username,
        repositories: githubProfile.repositories as unknown as GitHubProfileData["repositories"],
        languages: githubProfile.languages as unknown as GitHubProfileData["languages"],
        commitPatterns: githubProfile.commitPatterns as unknown as GitHubProfileData["commitPatterns"],
        pullRequests: githubProfile.pullRequests as unknown as GitHubProfileData["pullRequests"],
        topTopics: githubProfile.topTopics,
        totalStars: githubProfile.totalStars,
        totalForks: githubProfile.totalForks,
        publicRepoCount: githubProfile.publicRepoCount,
        accountAge: githubProfile.accountAge,
      };
      return analyzeProfile(profileData);
    });

    const devProfile = await step.run("save-developer-profile", async () => {
      return db.developerProfile.upsert({
        where: { userId },
        create: {
          userId,
          profile: JSON.parse(JSON.stringify(result.profile)),
          modelUsed: result.modelUsed,
          durationMs: result.durationMs,
        },
        update: {
          profile: JSON.parse(JSON.stringify(result.profile)),
          modelUsed: result.modelUsed,
          durationMs: result.durationMs,
          generatedAt: new Date(),
        },
      });
    });

    await step.sendEvent("trigger-scout", {
      name: "profile/analyzed",
      data: { userId, developerProfileId: devProfile.id },
    });

    return { success: true, modelUsed: result.modelUsed };
  }
);
