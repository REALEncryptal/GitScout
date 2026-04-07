import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type PipelineStage =
  | "idle"
  | "syncing"
  | "analyzing"
  | "scouting"
  | "recommending"
  | "complete"
  | "failed";

export interface ScoutingStatusResponse {
  stage: PipelineStage;
  message: string;
  progress: number; // 0-100
  lastCompletedAt: string | null;
  candidateCount: number;
  recommendationCount: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [latestRun, pendingOrRunning, ghProfile, devProfile, recCount] =
    await Promise.all([
      db.scoutingRun.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { candidateRepos: true } } },
      }),
      db.scoutingRun.findFirst({
        where: { userId, status: { in: ["pending", "running"] } },
      }),
      db.gitHubProfile.findUnique({
        where: { userId },
        select: { fetchedAt: true },
      }),
      db.developerProfile.findUnique({
        where: { userId },
        select: { generatedAt: true },
      }),
      db.recommendation.count({
        where: { userId, status: { not: "dismissed" } },
      }),
    ]);

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const ghFreshlyUpdated = ghProfile && ghProfile.fetchedAt > twoMinutesAgo;
  const devFreshlyUpdated = devProfile && devProfile.generatedAt > twoMinutesAgo;

  let stage: PipelineStage = "idle";
  let message = "Ready to scout";
  let progress = 0;

  // Priority 1: There's an active scouting run (pending or running)
  if (pendingOrRunning) {
    if (pendingOrRunning.status === "pending") {
      // Pipeline just started, scouting run created but not yet running
      // Check what data exists to determine which pre-scout step we're in
      if (!ghFreshlyUpdated) {
        stage = "syncing";
        message = "Fetching your GitHub data...";
        progress = 10;
      } else if (!devFreshlyUpdated) {
        stage = "analyzing";
        message = "AI is analyzing your coding profile...";
        progress = 35;
      } else {
        stage = "scouting";
        message = "Starting repo search...";
        progress = 50;
      }
    } else {
      // status === "running"
      const runWithCandidates = await db.scoutingRun.findUnique({
        where: { id: pendingOrRunning.id },
        include: { _count: { select: { candidateRepos: true } } },
      });
      if (runWithCandidates && runWithCandidates._count.candidateRepos > 0) {
        stage = "recommending";
        message = "Generating personalized recommendations...";
        progress = 85;
      } else {
        stage = "scouting";
        message = "Searching GitHub for matching projects...";
        progress = 60;
      }
    }
  }
  // Priority 2: No active run, but data is freshly updating (early pipeline stages)
  // This catches the syncing/analyzing stages before a ScoutingRun is created
  else if (ghFreshlyUpdated && !devFreshlyUpdated) {
    stage = "analyzing";
    message = "AI is analyzing your coding profile...";
    progress = 35;
  }
  // Priority 3: GitHub data is being fetched right now (very fresh fetchedAt but profile existed before)
  // Detect syncing by checking if fetchedAt is within last 30 seconds
  else if (
    ghProfile &&
    ghProfile.fetchedAt > new Date(Date.now() - 30 * 1000) &&
    devProfile &&
    devProfile.generatedAt < twoMinutesAgo
  ) {
    stage = "analyzing";
    message = "AI is analyzing your coding profile...";
    progress = 35;
  }
  // Priority 4: Latest run has a final status
  else if (latestRun?.status === "completed") {
    stage = "complete";
    message = `Found ${latestRun._count.candidateRepos} matches, ${recCount} recommendations`;
    progress = 100;
  } else if (latestRun?.status === "failed") {
    stage = "failed";
    message = latestRun.error ?? "Scouting failed";
    progress = 0;
  }

  return NextResponse.json<ScoutingStatusResponse>({
    stage,
    message,
    progress,
    lastCompletedAt: latestRun?.completedAt?.toISOString() ?? null,
    candidateCount: latestRun?._count.candidateRepos ?? 0,
    recommendationCount: recCount,
  });
}
