import { z } from "zod/v4";

export const firstContributionSchema = z.object({
  type: z.enum(["issue", "documentation", "test", "refactor", "feature"]),
  title: z.string(),
  description: z
    .string()
    .describe("2-3 sentences on what to do and how to start"),
  issueUrl: z.url().optional(),
  estimatedEffort: z.enum(["< 1 hour", "1-3 hours", "3-8 hours", "1-2 days"]),
  filesLikelyInvolved: z.array(z.string()).max(5).optional(),
});

export const recommendationSchema = z.object({
  repoFullName: z.string(),
  repoUrl: z.url(),
  headline: z
    .string()
    .max(120)
    .describe("Catchy one-liner: why this repo needs you"),
  whyYoureAFit: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Specific reasons tied to the developer profile"),
  firstContribution: firstContributionSchema,
  matchScore: z.number().min(0).max(100),
  tags: z.array(z.string()).max(5),
});

export const recommendationListSchema = z.object({
  recommendations: z.array(recommendationSchema),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
export type FirstContribution = z.infer<typeof firstContributionSchema>;
