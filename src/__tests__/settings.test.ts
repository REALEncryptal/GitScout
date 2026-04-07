import { describe, it, expect } from "vitest";
import { filterCandidates } from "@/lib/github/search";
import type { SearchRepoResult } from "@/lib/github/search";

const now = new Date().toISOString();

const makeRepo = (overrides: Partial<SearchRepoResult> = {}): SearchRepoResult => ({
  fullName: "other/repo",
  url: "https://github.com/other/repo",
  description: "A test repo",
  language: "TypeScript",
  stars: 100,
  forks: 10,
  openIssues: 5,
  topics: ["typescript"],
  updatedAt: now,
  hasWiki: false,
  license: "MIT",
  owner: "other",
  ...overrides,
});

describe("filterCandidates with user settings", () => {
  it("excludes repos from excludedRepos list", () => {
    const repos = [
      makeRepo({ fullName: "facebook/react", owner: "facebook" }),
      makeRepo({ fullName: "vercel/next.js", owner: "vercel" }),
    ];

    const result = filterCandidates(repos, "myuser", {
      excludedRepos: ["facebook/react"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("vercel/next.js");
  });

  it("excludedRepos matching is case-insensitive", () => {
    const repos = [
      makeRepo({ fullName: "Facebook/React", owner: "Facebook" }),
    ];

    const result = filterCandidates(repos, "myuser", {
      excludedRepos: ["facebook/react"],
    });

    expect(result).toHaveLength(0);
  });

  it("excludes repos with excluded topics", () => {
    const repos = [
      makeRepo({ topics: ["blockchain", "typescript"] }),
      makeRepo({ fullName: "other/good", topics: ["typescript", "react"] }),
    ];

    const result = filterCandidates(repos, "myuser", {
      excludedTopics: ["blockchain"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/good");
  });

  it("excludedTopics matching is case-insensitive", () => {
    const repos = [makeRepo({ topics: ["Blockchain"] })];

    const result = filterCandidates(repos, "myuser", {
      excludedTopics: ["blockchain"],
    });

    expect(result).toHaveLength(0);
  });

  it("respects custom minStars from settings", () => {
    const repos = [
      makeRepo({ stars: 25 }),
      makeRepo({ stars: 100, fullName: "other/popular" }),
    ];

    const result = filterCandidates(repos, "myuser", { minStars: 50 });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/popular");
  });

  it("combines all filter options", () => {
    const repos = [
      makeRepo({ fullName: "excluded/repo", owner: "excluded" }),
      makeRepo({ fullName: "bad/topic", owner: "bad", topics: ["crypto"] }),
      makeRepo({ fullName: "low/stars", owner: "low", stars: 5 }),
      makeRepo({ fullName: "good/repo", owner: "good", stars: 200, topics: ["typescript"] }),
    ];

    const result = filterCandidates(repos, "myuser", {
      excludedRepos: ["excluded/repo"],
      excludedTopics: ["crypto"],
      minStars: 50,
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("good/repo");
  });
});
