"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Recommendation } from "@/lib/ai/schemas/recommendation";

export interface RecommendationWithMeta {
  id: string;
  repoFullName: string;
  status: string;
  createdAt: Date;
  data: Recommendation;
}

export async function getRecommendations(options: {
  status?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<{ items: RecommendationWithMeta[]; nextCursor: string | null }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { status, limit = 10, cursor } = options;

  const recs = await db.recommendation.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = recs.length > limit;
  const items = recs.slice(0, limit).map((r) => ({
    id: r.id,
    repoFullName: r.repoFullName,
    status: r.status,
    createdAt: r.createdAt,
    data: r.data as unknown as Recommendation,
  }));

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}
