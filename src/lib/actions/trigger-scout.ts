"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";

export async function triggerScout() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Check for active scouting run
  const activeRun = await db.scoutingRun.findFirst({
    where: {
      userId,
      status: { in: ["pending", "running"] },
    },
  });

  if (activeRun) {
    throw new Error("A scan is already in progress. Please wait for it to finish.");
  }

  // Check credits
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) {
    throw new Error("No credits remaining. You've used all 10 free scans.");
  }

  // Deduct credit
  await db.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  });

  await inngest.send({
    name: "github/sync.requested",
    data: { userId },
  });

  return { success: true, creditsRemaining: user.credits - 1 };
}

export async function getCredits(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  return user?.credits ?? 0;
}
