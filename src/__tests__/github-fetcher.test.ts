import { describe, it, expect } from "vitest";
import {
  aggregateLanguages,
  analyzeCommitPatterns,
  analyzePullRequests,
  extractTopTopics,
} from "@/lib/github/fetcher";
import type { RepoSummary } from "@/lib/github/types";

describe("aggregateLanguages", () => {
  it("combines language bytes across repos", () => {
    const result = aggregateLanguages([
      { TypeScript: 5000, JavaScript: 2000 },
      { TypeScript: 3000, Python: 1000 },
      { JavaScript: 4000 },
    ]);

    expect(result).toEqual({
      TypeScript: 8000,
      JavaScript: 6000,
      Python: 1000,
    });
  });

  it("returns sorted by bytes descending", () => {
    const result = aggregateLanguages([
      { C: 100, Rust: 5000, Go: 3000 },
    ]);

    const keys = Object.keys(result);
    expect(keys).toEqual(["Rust", "Go", "C"]);
  });

  it("returns empty object for empty input", () => {
    expect(aggregateLanguages([])).toEqual({});
  });
});

describe("analyzeCommitPatterns", () => {
  it("counts push events and calculates stats", () => {
    const events = [
      { type: "PushEvent", created_at: "2026-03-01T10:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-01T14:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-02T10:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-03T10:00:00Z" },
      { type: "IssuesEvent", created_at: "2026-03-03T12:00:00Z" }, // not a push
    ];

    const result = analyzeCommitPatterns(events);

    expect(result.totalCommits).toBe(4);
    expect(result.activeDays).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.peakHour).toBe(10);
    expect(result.avgPerWeek).toBeGreaterThan(0);
  });

  it("returns zeros for no push events", () => {
    const result = analyzeCommitPatterns([
      { type: "IssuesEvent", created_at: "2026-03-01T10:00:00Z" },
    ]);

    expect(result.totalCommits).toBe(0);
    expect(result.activeDays).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("returns zeros for empty events", () => {
    const result = analyzeCommitPatterns([]);
    expect(result.totalCommits).toBe(0);
    expect(result.peakDay).toBe("Unknown");
  });

  it("calculates streak correctly with gaps", () => {
    const events = [
      { type: "PushEvent", created_at: "2026-03-01T10:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-02T10:00:00Z" },
      // gap on March 3
      { type: "PushEvent", created_at: "2026-03-04T10:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-05T10:00:00Z" },
      { type: "PushEvent", created_at: "2026-03-06T10:00:00Z" },
    ];

    const result = analyzeCommitPatterns(events);
    expect(result.longestStreak).toBe(3); // March 4-5-6
  });
});

describe("analyzePullRequests", () => {
  it("counts opened and merged PRs", () => {
    const prs = [
      { state: "closed", pull_request: { merged_at: "2026-03-01T10:00:00Z" } },
      { state: "closed", pull_request: { merged_at: null } },
      { state: "open", pull_request: { merged_at: null } },
    ];

    const result = analyzePullRequests(prs);
    expect(result.opened).toBe(3);
    expect(result.merged).toBe(1);
    expect(result.reviewed).toBe(0);
  });

  it("returns zeros for empty array", () => {
    const result = analyzePullRequests([]);
    expect(result.opened).toBe(0);
    expect(result.merged).toBe(0);
  });
});

describe("extractTopTopics", () => {
  it("returns topics sorted by frequency", () => {
    const repos: Pick<RepoSummary, "topics">[] = [
      { topics: ["react", "typescript", "nextjs"] },
      { topics: ["react", "typescript"] },
      { topics: ["react", "tailwind"] },
      { topics: ["python", "django"] },
    ];

    const result = extractTopTopics(repos as RepoSummary[]);
    expect(result[0]).toBe("react"); // appears 3 times
    expect(result[1]).toBe("typescript"); // appears 2 times
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("respects limit parameter", () => {
    const repos: Pick<RepoSummary, "topics">[] = [
      { topics: ["a", "b", "c", "d", "e"] },
    ];

    const result = extractTopTopics(repos as RepoSummary[], 3);
    expect(result.length).toBe(3);
  });

  it("returns empty for repos with no topics", () => {
    const repos: Pick<RepoSummary, "topics">[] = [
      { topics: [] },
      { topics: [] },
    ];

    expect(extractTopTopics(repos as RepoSummary[])).toEqual([]);
  });
});
