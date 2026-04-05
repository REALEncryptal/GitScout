import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GitHubProfileData } from "@/lib/github/types";

const mockProfile: GitHubProfileData = {
  username: "testuser",
  repositories: [
    {
      name: "my-app",
      fullName: "testuser/my-app",
      description: "A Next.js application",
      language: "TypeScript",
      languages: { TypeScript: 50000, CSS: 5000 },
      stars: 25,
      forks: 3,
      openIssues: 2,
      topics: ["nextjs", "react", "typescript"],
      isForked: false,
      isMaintainer: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2026-03-01T00:00:00Z",
      pushedAt: "2026-03-01T00:00:00Z",
    },
  ],
  languages: { TypeScript: 50000, CSS: 5000 },
  commitPatterns: {
    totalCommits: 150,
    avgPerWeek: 5.2,
    peakDay: "Monday",
    peakHour: 10,
    activeDays: 90,
    longestStreak: 14,
  },
  pullRequests: { opened: 30, merged: 25, reviewed: 0 },
  topTopics: ["nextjs", "react", "typescript"],
  totalStars: 25,
  totalForks: 3,
  publicRepoCount: 10,
  accountAge: 3.5,
};

const mockGeneratedProfile = {
  summary: "A TypeScript-focused full-stack developer.",
  primaryLanguages: [
    {
      language: "TypeScript",
      proficiencyLevel: "expert" as const,
      evidence: "50KB across main projects",
    },
  ],
  expertiseAreas: [
    {
      area: "React/Next.js",
      confidence: 0.85,
      evidence: "Main project is a Next.js app",
    },
  ],
  contributionStyle: {
    type: "maintainer" as const,
    description: "Maintains own projects",
    preferredContributions: ["features" as const, "bug-fixes" as const],
  },
  commitPatterns: {
    frequency: "regular" as const,
    qualityAssessment: "Consistent weekly commits",
  },
  idealProjectTraits: ["TypeScript-first", "Web applications"],
};

// Mock the AI SDK
vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: mockGeneratedProfile,
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-openai-model"),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-anthropic-model"),
}));

describe("Profile Analyzer Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("analyzes a profile and returns structured result", async () => {
    const { analyzeProfile } = await import("@/lib/agents/profile-analyzer");
    const result = await analyzeProfile(mockProfile);

    expect(result.profile).toEqual(mockGeneratedProfile);
    expect(result.modelUsed).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("calls generateObject with correct parameters", async () => {
    const { generateObject } = await import("ai");
    const { analyzeProfile } = await import("@/lib/agents/profile-analyzer");

    await analyzeProfile(mockProfile);

    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("expert developer talent analyst"),
        prompt: expect.stringContaining("testuser"),
        temperature: 0.3,
      })
    );
  });

  it("retries on failure", async () => {
    const { generateObject } = await import("ai");
    const { analyzeProfile } = await import("@/lib/agents/profile-analyzer");

    vi.mocked(generateObject)
      .mockRejectedValueOnce(new Error("API error"))
      .mockResolvedValueOnce({ object: mockGeneratedProfile } as never);

    const result = await analyzeProfile(mockProfile, { maxRetries: 3 });
    expect(result.profile).toEqual(mockGeneratedProfile);
    expect(generateObject).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const { generateObject } = await import("ai");
    const { analyzeProfile } = await import("@/lib/agents/profile-analyzer");

    vi.mocked(generateObject).mockRejectedValue(new Error("API down"));

    await expect(
      analyzeProfile(mockProfile, { maxRetries: 2 })
    ).rejects.toThrow("Profile analysis failed after 2 attempts");
  });
});

describe("buildProfilePrompt", () => {
  it("includes key profile data in the prompt", async () => {
    const { buildProfilePrompt } = await import(
      "@/lib/ai/prompts/profile-analyzer"
    );
    const prompt = buildProfilePrompt(mockProfile);

    expect(prompt).toContain("testuser");
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("3.5 years");
    expect(prompt).toContain("25");
    expect(prompt).toContain("Monday");
    expect(prompt).toContain("my-app");
  });

  it("handles empty repositories gracefully", async () => {
    const { buildProfilePrompt } = await import(
      "@/lib/ai/prompts/profile-analyzer"
    );
    const emptyProfile: GitHubProfileData = {
      ...mockProfile,
      repositories: [],
      languages: {},
      topTopics: [],
    };

    const prompt = buildProfilePrompt(emptyProfile);
    expect(prompt).toContain("testuser");
    expect(prompt).toContain("No repositories found");
  });
});
