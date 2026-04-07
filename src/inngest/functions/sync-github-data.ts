import { inngest } from "../client";
import { db } from "@/lib/db";
import { fetchGitHubProfile } from "@/lib/github/fetcher";
import { createGitHubClient } from "@/lib/github/client";

export const syncGitHubData = inngest.createFunction(
  {
    id: "sync-github-data",
    retries: 3,
    triggers: [{ event: "github/sync.requested" }],
  },
  async ({ event, step }: { event: { data: { userId: string } }; step: any }) => {
    const { userId } = event.data;

    // Create a scouting run immediately so the UI can track pipeline progress
    const run = await step.run("create-scouting-run", async () => {
      return db.scoutingRun.create({
        data: { userId, status: "pending", startedAt: new Date() },
      });
    });

    const account = await step.run("get-access-token", async () => {
      const acc = await db.account.findFirst({
        where: { userId, provider: "github" },
        select: { access_token: true },
      });
      if (!acc?.access_token) throw new Error("No GitHub account linked");
      return acc;
    });

    const username = await step.run("get-username", async () => {
      const client = createGitHubClient(account.access_token!);
      const user = await client.fetchAuthenticatedUser();
      return user.login;
    });

    const profileData = await step.run("fetch-github-data", async () => {
      return fetchGitHubProfile(account.access_token!, username);
    });

    const githubProfile = await step.run("save-github-profile", async () => {
      return db.gitHubProfile.upsert({
        where: { userId },
        create: {
          userId,
          username: profileData.username,
          repositories: JSON.parse(JSON.stringify(profileData.repositories)),
          languages: JSON.parse(JSON.stringify(profileData.languages)),
          commitPatterns: JSON.parse(JSON.stringify(profileData.commitPatterns)),
          pullRequests: JSON.parse(JSON.stringify(profileData.pullRequests)),
          topTopics: profileData.topTopics,
          totalStars: profileData.totalStars,
          totalForks: profileData.totalForks,
          publicRepoCount: profileData.publicRepoCount,
          accountAge: profileData.accountAge,
        },
        update: {
          username: profileData.username,
          repositories: JSON.parse(JSON.stringify(profileData.repositories)),
          languages: JSON.parse(JSON.stringify(profileData.languages)),
          commitPatterns: JSON.parse(JSON.stringify(profileData.commitPatterns)),
          pullRequests: JSON.parse(JSON.stringify(profileData.pullRequests)),
          topTopics: profileData.topTopics,
          totalStars: profileData.totalStars,
          totalForks: profileData.totalForks,
          publicRepoCount: profileData.publicRepoCount,
          accountAge: profileData.accountAge,
          fetchedAt: new Date(),
        },
      });
    });

    await step.sendEvent("trigger-analyze", {
      name: "github/sync.completed",
      data: { userId, githubProfileId: githubProfile.id, scoutingRunId: run.id },
    });

    return { success: true, username, repoCount: profileData.repositories.length };
  }
);
