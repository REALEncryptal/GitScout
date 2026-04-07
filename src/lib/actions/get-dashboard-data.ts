"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";

export interface DashboardData {
  hasGitHubProfile: boolean;
  hasDeveloperProfile: boolean;
  developerProfile: DeveloperProfile | null;
  githubUsername: string | null;
  credits: number;
  isScanning: boolean;
  scoutingStatus: {
    latestRunId: string | null;
    status: string | null;
    completedAt: Date | null;
    candidateCount: number;
    recommendationCount: number;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [user, ghProfile, devProfile, latestRun, activeRun, recCount] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      }),
      db.gitHubProfile.findUnique({
        where: { userId },
        select: { username: true },
      }),
      db.developerProfile.findUnique({
        where: { userId },
        select: { profile: true },
      }),
      db.scoutingRun.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { candidateRepos: true } } },
      }),
      db.scoutingRun.findFirst({
        where: { userId, status: { in: ["pending", "running"] } },
      }),
      db.recommendation.count({
        where: { userId, status: { not: "dismissed" } },
      }),
    ]);

  return {
    hasGitHubProfile: !!ghProfile,
    hasDeveloperProfile: !!devProfile,
    developerProfile: devProfile
      ? (devProfile.profile as unknown as DeveloperProfile)
      : null,
    githubUsername: ghProfile?.username ?? null,
    credits: user?.credits ?? 0,
    isScanning: !!activeRun,
    scoutingStatus: {
      latestRunId: latestRun?.id ?? null,
      status: latestRun?.status ?? null,
      completedAt: latestRun?.completedAt ?? null,
      candidateCount: latestRun?._count.candidateRepos ?? 0,
      recommendationCount: recCount,
    },
  };
}
