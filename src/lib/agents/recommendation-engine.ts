import { generateObject } from "ai";
import { getModel, getModelId } from "@/lib/ai/models";
import {
  recommendationListSchema,
  type Recommendation,
} from "@/lib/ai/schemas/recommendation";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";
import { createGitHubClient } from "@/lib/github/client";
import {
  RECOMMENDATION_SYSTEM_PROMPT,
  buildRecommendationPrompt,
} from "@/lib/ai/prompts/recommendation-engine";

export interface RecommendationResult {
  recommendations: Recommendation[];
  modelUsed: string;
  durationMs: number;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function generateRecommendations(
  profile: DeveloperProfile,
  candidates: CandidateRepo[],
  accessToken: string,
  options: { maxRecommendations?: number; modelId?: string } = {}
): Promise<RecommendationResult> {
  const { maxRecommendations = 10, modelId } = options;
  const resolvedModelId = modelId ?? getModelId();
  const client = createGitHubClient(accessToken);
  const start = Date.now();

  // Take the top candidates by score
  const topCandidates = candidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxRecommendations);

  // Fetch additional details for each candidate repo (README + issues)
  // Process in batches of 3 to manage rate limits
  const repoDetails = new Map<
    string,
    {
      readme: string | null;
      issues: { title: string; labels: string[]; url: string }[];
    }
  >();

  const batches = chunk(topCandidates, 3);

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async (candidate) => {
        const [owner, repo] = candidate.repoFullName.split("/");
        const [readme, issues] = await Promise.all([
          client.fetchRepoReadme(owner, repo),
          client.fetchRepoIssues(owner, repo, "good first issue,help wanted"),
        ]);

        return {
          repoFullName: candidate.repoFullName,
          readme,
          issues: issues.map((i) => ({
            title: i.title,
            labels: i.labels
              .map((l) => (typeof l === "string" ? l : l.name ?? ""))
              .filter(Boolean),
            url: i.html_url,
          })),
        };
      })
    );

    for (const result of results) {
      repoDetails.set(result.repoFullName, {
        readme: result.readme,
        issues: result.issues,
      });
    }
  }

  // Generate recommendations with structured output
  const { object } = await generateObject({
    model: getModel(resolvedModelId),
    schema: recommendationListSchema,
    system: RECOMMENDATION_SYSTEM_PROMPT,
    prompt: buildRecommendationPrompt(profile, topCandidates, repoDetails),
    temperature: 0.3,
  });

  // Sort by match score
  const recommendations = object.recommendations.sort(
    (a, b) => b.matchScore - a.matchScore
  );

  return {
    recommendations,
    modelUsed: resolvedModelId,
    durationMs: Date.now() - start,
  };
}
