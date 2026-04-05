import { describe, it, expect } from "vitest";
import {
  recommendationSchema,
  recommendationListSchema,
} from "@/lib/ai/schemas/recommendation";

const validRecommendation = {
  repoFullName: "vercel/ai",
  repoUrl: "https://github.com/vercel/ai",
  headline: "Your TypeScript expertise is exactly what the AI SDK needs",
  whyYoureAFit: [
    "Expert TypeScript skills match the SDK's codebase",
    "React experience aligns with the streaming UI components",
  ],
  firstContribution: {
    type: "issue" as const,
    title: "Fix type inference for tool parameters",
    description:
      "The tool parameter types lose inference when using optional fields. You can fix this by updating the generic constraints in src/core/tool.ts.",
    issueUrl: "https://github.com/vercel/ai/issues/1234",
    estimatedEffort: "1-3 hours" as const,
    filesLikelyInvolved: ["src/core/tool.ts", "src/core/types.ts"],
  },
  matchScore: 88,
  tags: ["typescript", "ai", "react", "sdk"],
};

describe("recommendationSchema", () => {
  it("validates a well-formed recommendation", () => {
    const result = recommendationSchema.safeParse(validRecommendation);
    expect(result.success).toBe(true);
  });

  it("rejects missing headline", () => {
    const { headline: _, ...noHeadline } = validRecommendation;
    const result = recommendationSchema.safeParse(noHeadline);
    expect(result.success).toBe(false);
  });

  it("rejects empty whyYoureAFit", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      whyYoureAFit: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 4 whyYoureAFit reasons", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      whyYoureAFit: ["a", "b", "c", "d", "e"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid firstContribution type", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      firstContribution: {
        ...validRecommendation.firstContribution,
        type: "magic",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid estimatedEffort", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      firstContribution: {
        ...validRecommendation.firstContribution,
        estimatedEffort: "5 minutes",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects matchScore above 100", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      matchScore: 150,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional issueUrl and filesLikelyInvolved", () => {
    const { issueUrl: _, filesLikelyInvolved: __, ...rest } =
      validRecommendation.firstContribution;
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      firstContribution: rest,
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 tags", () => {
    const result = recommendationSchema.safeParse({
      ...validRecommendation,
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });
});

describe("recommendationListSchema", () => {
  it("validates a list of recommendations", () => {
    const result = recommendationListSchema.safeParse({
      recommendations: [validRecommendation],
    });
    expect(result.success).toBe(true);
  });

  it("validates empty list", () => {
    const result = recommendationListSchema.safeParse({
      recommendations: [],
    });
    expect(result.success).toBe(true);
  });
});
