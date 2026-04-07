import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("@/lib/db", () => ({
  db: {
    account: {
      findFirst: vi.fn().mockResolvedValue({ access_token: "fake-token" }),
    },
    gitHubProfile: {
      findUnique: vi.fn().mockResolvedValue({
        id: "gh-profile-1",
        username: "testuser",
        repositories: [],
        languages: {},
        commitPatterns: {
          totalCommits: 100,
          avgPerWeek: 5,
          peakDay: "Monday",
          peakHour: 10,
          activeDays: 50,
          longestStreak: 7,
        },
        pullRequests: { opened: 10, merged: 8, reviewed: 0 },
        topTopics: ["typescript"],
        totalStars: 25,
        totalForks: 3,
        publicRepoCount: 10,
        accountAge: 3,
      }),
      upsert: vi.fn().mockResolvedValue({ id: "gh-profile-1" }),
    },
    developerProfile: {
      findUnique: vi.fn().mockResolvedValue({
        id: "dev-profile-1",
        profile: {
          summary: "TypeScript developer",
          primaryLanguages: [
            { language: "TypeScript", proficiencyLevel: "expert", evidence: "test" },
          ],
          expertiseAreas: [{ area: "React", confidence: 0.9, evidence: "test" }],
          contributionStyle: {
            type: "contributor",
            description: "Active contributor",
            preferredContributions: ["features"],
          },
          commitPatterns: { frequency: "regular", qualityAssessment: "Good" },
          idealProjectTraits: ["TypeScript-first"],
        },
      }),
      upsert: vi.fn().mockResolvedValue({ id: "dev-profile-1" }),
    },
    scoutingRun: {
      create: vi.fn().mockResolvedValue({ id: "run-1" }),
      findUnique: vi.fn().mockResolvedValue({
        id: "run-1",
        candidateRepos: [
          {
            matchData: {
              repoFullName: "test/repo",
              url: "https://github.com/test/repo",
              matchScore: 80,
              matchReasons: ["test"],
              primaryLanguage: "TypeScript",
              description: "test",
              stars: 100,
              openIssueCount: 10,
              lastActivityAt: "2026-04-01",
              suggestedIssueLabels: [],
              hasContributingGuide: true,
              estimatedDifficulty: "moderate",
            },
          },
        ],
      }),
      update: vi.fn(),
    },
    candidateRepo: {
      createMany: vi.fn(),
    },
    recommendation: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: "user-1" },
        { id: "user-2" },
      ]),
    },
    userSettings: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/github/client", () => ({
  createGitHubClient: vi.fn(() => ({
    fetchAuthenticatedUser: vi.fn().mockResolvedValue({ login: "testuser" }),
    fetchRepoReadme: vi.fn().mockResolvedValue("# Test"),
    fetchRepoIssues: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("@/lib/github/fetcher", () => ({
  fetchGitHubProfile: vi.fn().mockResolvedValue({
    username: "testuser",
    repositories: [],
    languages: { TypeScript: 5000 },
    commitPatterns: {
      totalCommits: 100,
      avgPerWeek: 5,
      peakDay: "Monday",
      peakHour: 10,
      activeDays: 50,
      longestStreak: 7,
    },
    pullRequests: { opened: 10, merged: 8, reviewed: 0 },
    topTopics: ["typescript"],
    totalStars: 25,
    totalForks: 3,
    publicRepoCount: 10,
    accountAge: 3,
  }),
}));

vi.mock("@/lib/agents/profile-analyzer", () => ({
  analyzeProfile: vi.fn().mockResolvedValue({
    profile: {
      summary: "TypeScript developer",
      primaryLanguages: [],
      expertiseAreas: [],
      contributionStyle: {
        type: "contributor",
        description: "test",
        preferredContributions: [],
      },
      commitPatterns: { frequency: "regular", qualityAssessment: "Good" },
      idealProjectTraits: [],
    },
    modelUsed: "openai/gpt-4o-mini",
    durationMs: 1000,
  }),
}));

vi.mock("@/lib/agents/repo-scout", () => ({
  scoutRepos: vi.fn().mockResolvedValue({
    candidates: [
      {
        repoFullName: "test/repo",
        url: "https://github.com/test/repo",
        matchScore: 80,
      },
    ],
    queriesUsed: ["language:typescript"],
    reposScanned: 20,
    modelUsed: "openai/gpt-4o-mini",
    durationMs: 2000,
  }),
}));

vi.mock("@/lib/agents/recommendation-engine", () => ({
  generateRecommendations: vi.fn().mockResolvedValue({
    recommendations: [
      {
        repoFullName: "test/repo",
        repoUrl: "https://github.com/test/repo",
        headline: "Test recommendation",
        whyYoureAFit: ["test"],
        firstContribution: {
          type: "issue",
          title: "Fix bug",
          description: "Fix the bug",
          estimatedEffort: "< 1 hour",
        },
        matchScore: 80,
        tags: ["typescript"],
      },
    ],
    modelUsed: "openai/gpt-4o-mini",
    durationMs: 3000,
  }),
}));

// Helper to create mock step object
function createMockStep() {
  const events: { name: string; data: Record<string, unknown> }[] = [];
  return {
    run: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
    sendEvent: vi.fn(
      (_name: string, event: { name: string; data: Record<string, unknown> } | { name: string; data: Record<string, unknown> }[]) => {
        if (Array.isArray(event)) {
          events.push(...event);
        } else {
          events.push(event);
        }
      }
    ),
    events,
  };
}

describe("Inngest Pipeline Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncGitHubData", () => {
    it("fetches data, saves profile, and emits github/sync.completed", async () => {
      const { syncGitHubData } = await import(
        "@/inngest/functions/sync-github-data"
      );
      const step = createMockStep();
      const handler = (syncGitHubData as any).fn;

      const result = await handler({
        event: { data: { userId: "user-1" } },
        step,
      });

      expect(result.success).toBe(true);
      expect(result.username).toBe("testuser");
      expect(step.sendEvent).toHaveBeenCalledWith(
        "trigger-analyze",
        expect.objectContaining({ name: "github/sync.completed" })
      );
    });
  });

  describe("analyzeProfileFn", () => {
    it("analyzes profile and emits profile/analyzed", async () => {
      const { analyzeProfileFn } = await import(
        "@/inngest/functions/analyze-profile"
      );
      const step = createMockStep();
      const handler = (analyzeProfileFn as any).fn;

      const result = await handler({
        event: { data: { userId: "user-1" } },
        step,
      });

      expect(result.success).toBe(true);
      expect(step.sendEvent).toHaveBeenCalledWith(
        "trigger-scout",
        expect.objectContaining({ name: "profile/analyzed" })
      );
    });
  });

  describe("scoutReposFn", () => {
    it("scouts repos and emits repos/scouted", async () => {
      const { scoutReposFn } = await import(
        "@/inngest/functions/scout-repos"
      );
      const step = createMockStep();
      const handler = (scoutReposFn as any).fn;

      const result = await handler({
        event: { data: { userId: "user-1" } },
        step,
      });

      expect(result.success).toBe(true);
      expect(result.candidateCount).toBe(1);
      expect(step.sendEvent).toHaveBeenCalledWith(
        "trigger-recommendations",
        expect.objectContaining({ name: "repos/scouted" })
      );
    });
  });

  describe("generateRecommendationsFn", () => {
    it("generates recommendations and emits recommendations/generated", async () => {
      const { generateRecommendationsFn } = await import(
        "@/inngest/functions/generate-recommendations"
      );
      const step = createMockStep();
      const handler = (generateRecommendationsFn as any).fn;

      const result = await handler({
        event: { data: { userId: "user-1", scoutingRunId: "run-1" } },
        step,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(step.sendEvent).toHaveBeenCalledWith(
        "notify-complete",
        expect.objectContaining({
          name: "recommendations/generated",
          data: { userId: "user-1", count: 1 },
        })
      );
    });
  });

  describe("scheduledScout", () => {
    it("finds active users and sends sync events", async () => {
      const { scheduledScout } = await import(
        "@/inngest/functions/scheduled-scout"
      );
      const step = createMockStep();
      const handler = (scheduledScout as any).fn;

      const result = await handler({ step });

      expect(result.success).toBe(true);
      expect(result.usersTriggered).toBe(2);
      expect(step.sendEvent).toHaveBeenCalledWith(
        "fan-out-scouts",
        expect.arrayContaining([
          expect.objectContaining({
            name: "github/sync.requested",
            data: { userId: "user-1" },
          }),
        ])
      );
    });
  });
});
