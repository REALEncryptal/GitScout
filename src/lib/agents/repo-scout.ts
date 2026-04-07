import { generateText, generateObject } from "ai";
import { z } from "zod/v4";
import { getModel, getModelId } from "@/lib/ai/models";
import { scoredReposSchema } from "@/lib/ai/schemas/candidate-repo";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import { createGitHubClient } from "@/lib/github/client";
import { filterCandidates, type FilterOptions } from "@/lib/github/search";
import type { SearchRepoResult } from "@/lib/github/search";
import {
  REPO_SCOUT_SYSTEM_PROMPT,
  REPO_SCORER_SYSTEM_PROMPT,
  buildScoutPrompt,
  buildScoringPrompt,
} from "@/lib/ai/prompts/repo-scout";

export interface ScoutResult {
  candidates: CandidateRepo[];
  queriesUsed: string[];
  reposScanned: number;
  modelUsed: string;
  durationMs: number;
}

export async function scoutRepos(
  profile: DeveloperProfile,
  accessToken: string,
  username: string,
  options: { maxResults?: number; modelId?: string; filterOptions?: FilterOptions } = {}
): Promise<ScoutResult> {
  const { maxResults = 20, modelId, filterOptions } = options;
  const resolvedModelId = modelId ?? getModelId();
  const client = createGitHubClient(accessToken);
  const start = Date.now();

  const queriesUsed: string[] = [];
  const allRepos: SearchRepoResult[] = [];

  // Phase 1: Use AI with tools to search GitHub
  // AI SDK v6 auto-loops tool calls until the model is done
  await generateText({
    model: getModel(resolvedModelId),
    system: REPO_SCOUT_SYSTEM_PROMPT,
    prompt: buildScoutPrompt(profile),
    tools: {
      searchRepos: {
        description: "Search GitHub repositories matching a query string",
        inputSchema: z.object({
          query: z.string().describe("GitHub search query (e.g., 'language:typescript topic:react stars:>50')"),
          sort: z.enum(["stars", "updated"]).optional().describe("Sort order"),
        }),
        execute: async ({
          query,
          sort,
        }: {
          query: string;
          sort?: "stars" | "updated";
        }) => {
          queriesUsed.push(query);
          try {
            const results = await client.searchRepos(query, sort ?? "stars", 20);
            const mapped = results.map((repo) => ({
              fullName: repo.full_name,
              description: repo.description,
              language: repo.language,
              stars: repo.stargazers_count ?? 0,
              forks: repo.forks_count ?? 0,
              openIssues: repo.open_issues_count ?? 0,
              topics: repo.topics ?? [],
              updatedAt: repo.updated_at ?? "",
              url: repo.html_url,
              hasWiki: repo.has_wiki ?? false,
              license: repo.license?.spdx_id ?? null,
              owner: repo.owner?.login ?? "",
            }));
            allRepos.push(...mapped);
            return mapped.map((r) => ({
              fullName: r.fullName,
              description: r.description,
              language: r.language,
              stars: r.stars,
              openIssues: r.openIssues,
              topics: r.topics,
            }));
          } catch (error) {
            return { error: `Search failed: ${error}` };
          }
        },
      },
      getRepoIssues: {
        description:
          "Get open issues for a specific repo, optionally filtered by label",
        inputSchema: z.object({
          owner: z.string(),
          repo: z.string(),
          labels: z
            .string()
            .optional()
            .describe(
              'Comma-separated labels, e.g., "good first issue,help wanted"'
            ),
        }),
        execute: async ({
          owner,
          repo,
          labels,
        }: {
          owner: string;
          repo: string;
          labels?: string;
        }) => {
          try {
            const issues = await client.fetchRepoIssues(owner, repo, labels);
            return issues.slice(0, 5).map((i) => ({
              title: i.title,
              labels: i.labels
                .map((l) => (typeof l === "string" ? l : l.name ?? ""))
                .filter(Boolean),
              comments: i.comments,
            }));
          } catch (error) {
            return { error: `Failed to fetch issues: ${error}` };
          }
        },
      },
    },
    temperature: 0.5,
  });

  // Filter out user's own repos, inactive ones, and user-excluded repos/topics
  const filtered = filterCandidates(allRepos, username, filterOptions);

  // Deduplicate by fullName
  const unique = [...new Map(filtered.map((r) => [r.fullName, r])).values()];

  if (unique.length === 0) {
    return {
      candidates: [],
      queriesUsed,
      reposScanned: allRepos.length,
      modelUsed: resolvedModelId,
      durationMs: Date.now() - start,
    };
  }

  // Phase 2: Score the filtered repos with structured output
  const { object: scored } = await generateObject({
    model: getModel(resolvedModelId),
    schema: scoredReposSchema,
    system: REPO_SCORER_SYSTEM_PROMPT,
    prompt: buildScoringPrompt(
      profile,
      unique.map((r) => ({
        fullName: r.fullName,
        description: r.description,
        language: r.language,
        stars: r.stars,
        openIssues: r.openIssues,
        topics: r.topics,
        updatedAt: r.updatedAt,
      }))
    ),
    temperature: 0.2,
  });

  // Sort by score and limit
  const candidates = scored.repos
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);

  return {
    candidates,
    queriesUsed,
    reposScanned: allRepos.length,
    modelUsed: resolvedModelId,
    durationMs: Date.now() - start,
  };
}
