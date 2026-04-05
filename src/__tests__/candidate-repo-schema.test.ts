import { describe, it, expect } from "vitest";
import {
  candidateRepoSchema,
  scoredReposSchema,
} from "@/lib/ai/schemas/candidate-repo";

const validCandidate = {
  repoFullName: "facebook/react",
  url: "https://github.com/facebook/react",
  description: "A JavaScript library for building user interfaces",
  primaryLanguage: "JavaScript",
  stars: 220000,
  openIssueCount: 1200,
  lastActivityAt: "2026-04-01T00:00:00Z",
  matchScore: 85,
  matchReasons: [
    "Strong JavaScript/TypeScript skills match",
    "React expertise directly applicable",
  ],
  suggestedIssueLabels: ["good first issue", "help wanted"],
  hasContributingGuide: true,
  estimatedDifficulty: "moderate" as const,
};

describe("candidateRepoSchema", () => {
  it("validates a well-formed candidate", () => {
    const result = candidateRepoSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it("rejects matchScore above 100", () => {
    const result = candidateRepoSchema.safeParse({
      ...validCandidate,
      matchScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects matchScore below 0", () => {
    const result = candidateRepoSchema.safeParse({
      ...validCandidate,
      matchScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const result = candidateRepoSchema.safeParse({
      ...validCandidate,
      estimatedDifficulty: "impossible",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = candidateRepoSchema.safeParse({
      ...validCandidate,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 match reasons", () => {
    const result = candidateRepoSchema.safeParse({
      ...validCandidate,
      matchReasons: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });
});

describe("scoredReposSchema", () => {
  it("validates an array of candidates", () => {
    const result = scoredReposSchema.safeParse({
      repos: [validCandidate],
    });
    expect(result.success).toBe(true);
  });

  it("validates empty repos array", () => {
    const result = scoredReposSchema.safeParse({ repos: [] });
    expect(result.success).toBe(true);
  });
});
