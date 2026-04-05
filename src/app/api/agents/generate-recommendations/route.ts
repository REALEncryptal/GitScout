import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRecommendations } from "@/lib/agents/recommendation-engine";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Need developer profile
  const devProfile = await db.developerProfile.findUnique({
    where: { userId },
  });

  if (!devProfile) {
    return NextResponse.json(
      { error: "No developer profile. Run /api/agents/analyze-profile first." },
      { status: 400 }
    );
  }

  // Get the latest completed scouting run with candidates
  const latestRun = await db.scoutingRun.findFirst({
    where: { userId, status: "completed" },
    orderBy: { createdAt: "desc" },
    include: {
      candidateRepos: {
        orderBy: { matchScore: "desc" },
        take: 15,
      },
    },
  });

  if (!latestRun || latestRun.candidateRepos.length === 0) {
    return NextResponse.json(
      { error: "No scouting results. Run /api/agents/scout-repos first." },
      { status: 400 }
    );
  }

  // Get GitHub access token
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

  const profile = devProfile.profile as unknown as DeveloperProfile;
  const candidates = latestRun.candidateRepos.map(
    (c) => c.matchData as unknown as CandidateRepo
  );

  const result = await generateRecommendations(
    profile,
    candidates,
    account.access_token
  );

  // Store recommendations
  if (result.recommendations.length > 0) {
    // Clear old recommendations for this user from this run
    await db.recommendation.deleteMany({
      where: { userId, scoutingRunId: latestRun.id },
    });

    await db.recommendation.createMany({
      data: result.recommendations.map((rec) => ({
        userId,
        scoutingRunId: latestRun.id,
        repoFullName: rec.repoFullName,
        data: JSON.parse(JSON.stringify(rec)),
      })),
    });
  }

  return NextResponse.json({
    status: "generated",
    count: result.recommendations.length,
    modelUsed: result.modelUsed,
    durationMs: result.durationMs,
    recommendations: result.recommendations.map((r) => ({
      repo: r.repoFullName,
      headline: r.headline,
      score: r.matchScore,
      firstContribution: r.firstContribution.title,
    })),
  });
}
