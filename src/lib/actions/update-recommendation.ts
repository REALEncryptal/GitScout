"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateRecommendationStatus(
  recommendationId: string,
  status: "viewed" | "saved" | "dismissed" | "applied"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rec = await db.recommendation.findUnique({
    where: { id: recommendationId },
    select: { userId: true },
  });

  if (!rec || rec.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await db.recommendation.update({
    where: { id: recommendationId },
    data: { status },
  });

  return { success: true };
}
