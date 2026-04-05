import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchGitHubProfile } from "@/lib/github/fetcher";
import { createGitHubClient } from "@/lib/github/client";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Coerce typed objects to plain JSON for Prisma Json fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJson(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check for cached profile
  const existing = await db.gitHubProfile.findUnique({
    where: { userId },
    select: { fetchedAt: true },
  });

  if (existing) {
    const age = Date.now() - existing.fetchedAt.getTime();
    if (age < CACHE_DURATION_MS) {
      return NextResponse.json({
        status: "cached",
        message: "Profile data is fresh (less than 24h old)",
      });
    }
  }

  // Get GitHub access token from Account
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No GitHub account linked" },
      { status: 400 }
    );
  }

  // Resolve the GitHub username via API
  const client = createGitHubClient(account.access_token);
  const ghUser = await client.fetchAuthenticatedUser();

  const profileData = await fetchGitHubProfile(
    account.access_token,
    ghUser.login
  );

  const data = {
    username: profileData.username,
    repositories: toJson(profileData.repositories),
    languages: toJson(profileData.languages),
    commitPatterns: toJson(profileData.commitPatterns),
    pullRequests: toJson(profileData.pullRequests),
    topTopics: profileData.topTopics,
    totalStars: profileData.totalStars,
    totalForks: profileData.totalForks,
    publicRepoCount: profileData.publicRepoCount,
    accountAge: profileData.accountAge,
  };

  // Upsert the profile
  await db.gitHubProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data, fetchedAt: new Date() },
  });

  return NextResponse.json({
    status: "synced",
    username: profileData.username,
    repoCount: profileData.repositories.length,
    languages: Object.keys(profileData.languages).slice(0, 5),
  });
}
