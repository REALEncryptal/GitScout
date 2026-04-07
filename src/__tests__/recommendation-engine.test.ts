import { describe, it, expect, vi, beforeEach } from "vitest";
import { chunk } from "@/lib/agents/recommendation-engine";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";

const mockProfile: DeveloperProfile = {
  summary: "A TypeScript expert focused on React and Node.js",
  primaryLanguages: [
    {
      language: "TypeScript",
      proficiencyLevel: "expert",
      evidence: "50+ repos",
    },
  ],
  expertiseAreas: [
    { area: "React", confidence: 0.9, evidence: "Main framework" },
  ],
  contributionStyle: {
    type: "contributor",
    description: "Active contributor to open source",
    preferredContributions: ["bug-fixes", "features"],
  },
  commitPatterns: {
    frequency: "regular",
    qualityAssessment: "Consistent commits",
  },
  idealProjectTraits: ["TypeScript-first", "Active community"],
};

const mockCandidates: CandidateRepo[] = [
  {
    repoFullName: "vercel/ai",
    url: "https://github.com/vercel/ai",
    description: "Build AI-powered applications",
    primaryLanguage: "TypeScript",
    stars: 5000,
    openIssueCount: 50,
    lastActivityAt: "2026-04-01",
    matchScore: 90,
    matchReasons: ["TypeScript match", "React components"],
    suggestedIssueLabels: ["good first issue"],
    hasContributingGuide: true,
    estimatedDifficulty: "moderate",
  },
  {
    repoFullName: "shadcn-ui/ui",
    url: "https://github.com/shadcn-ui/ui",
    description: "Beautifully designed components",
    primaryLanguage: "TypeScript",
    stars: 70000,
    openIssueCount: 200,
    lastActivityAt: "2026-04-01",
    matchScore: 85,
    matchReasons: ["React expertise"],
    suggestedIssueLabels: ["help wanted"],
    hasContributingGuide: true,
    estimatedDifficulty: "beginner-friendly",
  },
];

const mockGeneratedRecommendations = {
  recommendations: [
    {
      repoFullName: "vercel/ai",
      repoUrl: "https://github.com/vercel/ai",
      headline: "Your TypeScript skills are perfect for the AI SDK",
      whyYoureAFit: ["Expert TypeScript aligns with the codebase"],
      firstContribution: {
        type: "issue" as const,
        title: "Fix streaming response types",
        description: "Update the streaming types to handle edge cases.",
        estimatedEffort: "1-3 hours" as const,
      },
      matchScore: 90,
      tags: ["typescript", "ai"],
    },
  ],
};

// Mock AI SDK
vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      recommendations: [
        {
          repoFullName: "vercel/ai",
          repoUrl: "https://github.com/vercel/ai",
          headline: "Your TypeScript skills are perfect for the AI SDK",
          whyYoureAFit: ["Expert TypeScript aligns with the codebase"],
          firstContribution: {
            type: "issue",
            title: "Fix streaming response types",
            description: "Update the streaming types to handle edge cases.",
            estimatedEffort: "1-3 hours",
          },
          matchScore: 90,
          tags: ["typescript", "ai"],
        },
      ],
    },
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-openai-model"),
  createOpenAI: vi.fn(() => vi.fn(() => "mock-openrouter-model")),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-anthropic-model"),
}));

// Mock GitHub client
vi.mock("@/lib/github/client", () => ({
  createGitHubClient: vi.fn(() => ({
    fetchRepoReadme: vi.fn().mockResolvedValue("# AI SDK\nBuild AI apps"),
    fetchRepoIssues: vi.fn().mockResolvedValue([
      {
        title: "Fix types",
        labels: [{ name: "good first issue" }],
        html_url: "https://github.com/vercel/ai/issues/1",
        comments: 2,
      },
    ]),
  })),
}));

describe("chunk utility", () => {
  it("chunks array into groups of specified size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns single chunk if array is smaller than size", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("handles chunk size of 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe("generateRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates recommendations from candidates", async () => {
    const { generateRecommendations } = await import(
      "@/lib/agents/recommendation-engine"
    );

    const result = await generateRecommendations(
      mockProfile,
      mockCandidates,
      "fake-token"
    );

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].repoFullName).toBe("vercel/ai");
    expect(result.modelUsed).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("calls generateObject with recommendation schema", async () => {
    const { generateObject } = await import("ai");
    const { generateRecommendations } = await import(
      "@/lib/agents/recommendation-engine"
    );

    await generateRecommendations(mockProfile, mockCandidates, "fake-token");

    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("open-source contribution advisor"),
        prompt: expect.stringContaining("vercel/ai"),
        temperature: 0.3,
      })
    );
  });

  it("sorts candidates by score before processing", async () => {
    const { generateObject } = await import("ai");
    const { generateRecommendations } = await import(
      "@/lib/agents/recommendation-engine"
    );

    const reversed = [...mockCandidates].reverse();
    await generateRecommendations(mockProfile, reversed, "fake-token");

    const call = vi.mocked(generateObject).mock.calls[0][0];
    // The prompt should contain vercel/ai first (score 90) before shadcn-ui/ui (score 85)
    const prompt = call.prompt as string;
    const vercelIdx = prompt.indexOf("vercel/ai");
    const shadcnIdx = prompt.indexOf("shadcn-ui/ui");
    expect(vercelIdx).toBeLessThan(shadcnIdx);
  });

  it("returns empty array when no candidates", async () => {
    const { generateObject } = await import("ai");
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { recommendations: [] },
    } as never);

    const { generateRecommendations } = await import(
      "@/lib/agents/recommendation-engine"
    );

    const result = await generateRecommendations(
      mockProfile,
      [],
      "fake-token"
    );

    expect(result.recommendations).toEqual([]);
  });
});
