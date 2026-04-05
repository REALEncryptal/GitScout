import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoutRepos } from "@/lib/agents/repo-scout";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Need a developer profile first
  const devProfile = await db.developerProfile.findUnique({
    where: { userId },
  });

  if (!devProfile) {
    return NextResponse.json(
      { error: "No developer profile. Run /api/agents/analyze-profile first." },
      { status: 400 }
    );
  }

  // Need GitHub access token
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

  // Get the username from the GitHub profile
  const ghProfile = await db.gitHubProfile.findUnique({
    where: { userId },
    select: { username: true },
  });

  if (!ghProfile) {
    return NextResponse.json(
      { error: "No GitHub profile data. Run /api/github/sync first." },
      { status: 400 }
    );
  }

  // Create scouting run record
  const run = await db.scoutingRun.create({
    data: {
      userId,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const profile = devProfile.profile as unknown as DeveloperProfile;

    const result = await scoutRepos(
      profile,
      account.access_token,
      ghProfile.username
    );

    // Store candidate repos
    if (result.candidates.length > 0) {
      await db.candidateRepo.createMany({
        data: result.candidates.map((c) => ({
          scoutingRunId: run.id,
          repoFullName: c.repoFullName,
          url: c.url,
          matchScore: c.matchScore,
          matchData: JSON.parse(JSON.stringify(c)),
        })),
      });
    }

    // Update scouting run as completed
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

    return NextResponse.json({
      status: "completed",
      runId: run.id,
      candidateCount: result.candidates.length,
      reposScanned: result.reposScanned,
      queriesUsed: result.queriesUsed,
      topMatches: result.candidates.slice(0, 5).map((c) => ({
        repo: c.repoFullName,
        score: c.matchScore,
        reasons: c.matchReasons,
      })),
    });
  } catch (error) {
    await db.scoutingRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Scouting failed", details: String(error) },
      { status: 500 }
    );
  }
}
