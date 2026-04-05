import { z } from "zod/v4";

export const developerProfileSchema = z.object({
  summary: z
    .string()
    .describe("2-3 sentence summary of the developer's skills and style"),

  primaryLanguages: z
    .array(
      z.object({
        language: z.string(),
        proficiencyLevel: z.enum(["expert", "advanced", "intermediate", "beginner"]),
        evidence: z.string().describe("Brief evidence from their GitHub history"),
      })
    )
    .max(5)
    .describe("Top programming languages with proficiency assessment"),

  expertiseAreas: z
    .array(
      z.object({
        area: z
          .string()
          .describe(
            'e.g., "CLI tooling", "React state management", "database optimization"'
          ),
        confidence: z.number().min(0).max(1),
        evidence: z.string(),
      })
    )
    .max(8)
    .describe("Areas of technical expertise"),

  contributionStyle: z.object({
    type: z.enum(["maintainer", "contributor", "explorer", "specialist"]),
    description: z.string(),
    preferredContributions: z
      .array(
        z.enum([
          "bug-fixes",
          "features",
          "documentation",
          "testing",
          "refactoring",
          "devops",
          "reviews",
        ])
      )
      .describe("Types of contributions this developer tends to make"),
  }),

  commitPatterns: z.object({
    frequency: z.enum(["daily", "regular", "sporadic", "burst"]),
    qualityAssessment: z
      .string()
      .describe("Assessment of commit patterns and consistency"),
  }),

  idealProjectTraits: z
    .array(z.string())
    .max(6)
    .describe("What kind of projects this developer would thrive in"),
});

export type DeveloperProfile = z.infer<typeof developerProfileSchema>;
