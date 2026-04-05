import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeProfile } from "@/lib/agents/profile-analyzer";
import type { GitHubProfileData } from "@/lib/github/types";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch the user's GitHub profile data
  const githubProfile = await db.gitHubProfile.findUnique({
    where: { userId },
  });

  if (!githubProfile) {
    return NextResponse.json(
      { error: "No GitHub profile data. Run /api/github/sync first." },
      { status: 400 }
    );
  }

  // Reconstruct GitHubProfileData from stored JSON
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

  // Run the profile analyzer agent
  const result = await analyzeProfile(profileData);

  // Store the developer profile
  await db.developerProfile.upsert({
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

  return NextResponse.json({
    status: "analyzed",
    modelUsed: result.modelUsed,
    durationMs: result.durationMs,
    profile: result.profile,
  });
}
