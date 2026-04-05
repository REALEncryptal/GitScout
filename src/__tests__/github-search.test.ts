import { describe, it, expect } from "vitest";
import { filterCandidates } from "@/lib/github/search";
import type { SearchRepoResult } from "@/lib/github/search";

const now = new Date().toISOString();
const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago

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

describe("filterCandidates", () => {
  it("removes user's own repos", () => {
    const repos = [
      makeRepo({ fullName: "myuser/my-repo", owner: "myuser" }),
      makeRepo({ fullName: "other/their-repo", owner: "other" }),
    ];

    const result = filterCandidates(repos, "myuser");
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/their-repo");
  });

  it("removes repos with too few stars", () => {
    const repos = [
      makeRepo({ stars: 5 }),
      makeRepo({ stars: 50, fullName: "other/popular" }),
    ];

    const result = filterCandidates(repos, "myuser");
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/popular");
  });

  it("removes inactive repos (not updated in 30 days)", () => {
    const repos = [
      makeRepo({ updatedAt: oldDate, fullName: "other/old-repo" }),
      makeRepo({ updatedAt: now, fullName: "other/active-repo" }),
    ];

    const result = filterCandidates(repos, "myuser");
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/active-repo");
  });

  it("respects custom minStars", () => {
    const repos = [
      makeRepo({ stars: 25 }),
      makeRepo({ stars: 100, fullName: "other/big" }),
    ];

    const result = filterCandidates(repos, "myuser", { minStars: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("other/big");
  });

  it("is case-insensitive for username matching", () => {
    const repos = [
      makeRepo({ owner: "MyUser", fullName: "MyUser/repo" }),
    ];

    const result = filterCandidates(repos, "myuser");
    expect(result).toHaveLength(0);
  });

  it("returns empty for empty input", () => {
    expect(filterCandidates([], "myuser")).toEqual([]);
  });
});
