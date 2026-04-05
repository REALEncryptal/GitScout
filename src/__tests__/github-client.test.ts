import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOctokit = {
  repos: {
    listForUser: vi.fn().mockResolvedValue({
      data: [
        {
          name: "test-repo",
          full_name: "testuser/test-repo",
          description: "A test repo",
          language: "TypeScript",
          stargazers_count: 10,
          forks_count: 2,
          open_issues_count: 3,
          topics: ["typescript"],
          fork: false,
          owner: { login: "testuser" },
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2026-03-01T00:00:00Z",
          pushed_at: "2026-03-01T00:00:00Z",
        },
      ],
      headers: {
        "x-ratelimit-remaining": "4999",
        "x-ratelimit-reset": "1700000000",
        "x-ratelimit-limit": "5000",
      },
    }),
    listLanguages: vi.fn().mockResolvedValue({
      data: { TypeScript: 5000, JavaScript: 2000 },
      headers: { "x-ratelimit-remaining": "4998" },
    }),
  },
  activity: {
    listPublicEventsForUser: vi.fn().mockResolvedValue({
      data: [],
      headers: { "x-ratelimit-remaining": "4997" },
    }),
  },
  search: {
    issuesAndPullRequests: vi.fn().mockResolvedValue({
      data: { items: [] },
      headers: { "x-ratelimit-remaining": "4996" },
    }),
  },
  users: {
    getAuthenticated: vi.fn().mockResolvedValue({
      data: {
        login: "testuser",
        public_repos: 5,
        created_at: "2020-01-01T00:00:00Z",
      },
      headers: { "x-ratelimit-remaining": "4995" },
    }),
    getByUsername: vi.fn().mockResolvedValue({
      data: {
        login: "testuser",
        public_repos: 5,
        created_at: "2020-01-01T00:00:00Z",
      },
      headers: { "x-ratelimit-remaining": "4994" },
    }),
  },
};

vi.mock("@octokit/rest", () => {
  return {
    Octokit: class {
      repos = mockOctokit.repos;
      activity = mockOctokit.activity;
      search = mockOctokit.search;
      users = mockOctokit.users;
    },
  };
});

import { createGitHubClient } from "@/lib/github/client";

describe("GitHub client", () => {
  let client: ReturnType<typeof createGitHubClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createGitHubClient("fake-token");
  });

  it("fetches user repos and updates rate limit state", async () => {
    const repos = await client.fetchUserRepos("testuser", 1);
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("test-repo");

    const rateLimit = client.getRateLimit();
    expect(rateLimit.remaining).toBe(4999);
  });

  it("fetches repo languages", async () => {
    const langs = await client.fetchRepoLanguages("testuser", "test-repo");
    expect(langs).toEqual({ TypeScript: 5000, JavaScript: 2000 });
  });

  it("fetches authenticated user", async () => {
    const user = await client.fetchAuthenticatedUser();
    expect(user.login).toBe("testuser");
  });

  it("fetches user by username", async () => {
    const user = await client.fetchUser("testuser");
    expect(user.login).toBe("testuser");
  });

  it("fetches events", async () => {
    const events = await client.fetchUserEvents("testuser", 1);
    expect(events).toEqual([]);
  });

  it("fetches PRs", async () => {
    const prs = await client.fetchUserPRs("testuser", 1);
    expect(prs).toEqual([]);
  });
});
