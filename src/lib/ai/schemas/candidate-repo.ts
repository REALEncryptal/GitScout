import { z } from "zod/v4";

export const candidateRepoSchema = z.object({
  repoFullName: z.string(),
  url: z.url(),
  description: z.string(),
  primaryLanguage: z.string(),
  stars: z.number(),
  openIssueCount: z.number(),
  lastActivityAt: z.string(),
  matchScore: z.number().min(0).max(100),
  matchReasons: z
    .array(z.string())
    .max(5)
    .describe("Why this repo matches the developer"),
  suggestedIssueLabels: z
    .array(z.string())
    .describe('Labels to look for, e.g., "good first issue", "help wanted"'),
  hasContributingGuide: z.boolean(),
  estimatedDifficulty: z.enum(["beginner-friendly", "moderate", "advanced"]),
});

export const scoredReposSchema = z.object({
  repos: z.array(candidateRepoSchema),
});

export type CandidateRepo = z.infer<typeof candidateRepoSchema>;
