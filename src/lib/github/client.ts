import { Octokit } from "@octokit/rest";

export interface RateLimitState {
  remaining: number;
  reset: number; // Unix timestamp
  limit: number;
}

export function createGitHubClient(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  let rateLimitState: RateLimitState = {
    remaining: 5000,
    reset: 0,
    limit: 5000,
  };

  function updateRateLimit(headers: Record<string, string | undefined>) {
    const remaining = headers["x-ratelimit-remaining"];
    const reset = headers["x-ratelimit-reset"];
    const limit = headers["x-ratelimit-limit"];

    if (remaining !== undefined) rateLimitState.remaining = parseInt(remaining);
    if (reset !== undefined) rateLimitState.reset = parseInt(reset);
    if (limit !== undefined) rateLimitState.limit = parseInt(limit);
  }

  async function waitForRateLimit() {
    if (rateLimitState.remaining > 100) return;

    const waitMs = Math.max(0, rateLimitState.reset * 1000 - Date.now()) + 1000;
    if (rateLimitState.remaining === 0 && waitMs > 0) {
      console.log(
        `[GitHub] Rate limit exhausted. Waiting ${Math.ceil(waitMs / 1000)}s`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  async function requestWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await waitForRateLimit();
      try {
        return await fn();
      } catch (error: unknown) {
        const status =
          error && typeof error === "object" && "status" in error
            ? (error as { status: number }).status
            : 0;

        if ((status === 403 || status === 429) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `[GitHub] Rate limited (${status}). Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  }

  return {
    getRateLimit: () => ({ ...rateLimitState }),

    async fetchUserRepos(username: string, maxPages = 5) {
      const repos = [];
      for (let page = 1; page <= maxPages; page++) {
        const { data, headers } = await requestWithRetry(() =>
          octokit.repos.listForUser({
            username,
            per_page: 100,
            page,
            sort: "updated",
            type: "owner",
          })
        );
        updateRateLimit(headers as Record<string, string | undefined>);
        repos.push(...data);
        if (data.length < 100) break;
      }
      return repos;
    },

    async fetchRepoLanguages(owner: string, repo: string) {
      const { data, headers } = await requestWithRetry(() =>
        octokit.repos.listLanguages({ owner, repo })
      );
      updateRateLimit(headers as Record<string, string | undefined>);
      return data;
    },

    async fetchUserEvents(username: string, maxPages = 3) {
      const events = [];
      for (let page = 1; page <= maxPages; page++) {
        const { data, headers } = await requestWithRetry(() =>
          octokit.activity.listPublicEventsForUser({
            username,
            per_page: 100,
            page,
          })
        );
        updateRateLimit(headers as Record<string, string | undefined>);
        events.push(...data);
        if (data.length < 100) break;
      }
      return events;
    },

    async fetchUserPRs(username: string, maxPages = 2) {
      const prs = [];
      for (let page = 1; page <= maxPages; page++) {
        const { data, headers } = await requestWithRetry(() =>
          octokit.search.issuesAndPullRequests({
            q: `author:${username} type:pr`,
            per_page: 50,
            page,
            sort: "updated",
          })
        );
        updateRateLimit(headers as Record<string, string | undefined>);
        prs.push(...data.items);
        if (data.items.length < 50) break;
      }
      return prs;
    },

    async searchRepos(query: string, sort: string = "stars", perPage: number = 20) {
      const { data, headers } = await requestWithRetry(() =>
        octokit.search.repos({
          q: query,
          sort: sort as "stars" | "updated",
          per_page: perPage,
        })
      );
      updateRateLimit(headers as Record<string, string | undefined>);
      return data.items;
    },

    async fetchRepoIssues(owner: string, repo: string, labels?: string) {
      const { data, headers } = await requestWithRetry(() =>
        octokit.issues.listForRepo({
          owner,
          repo,
          state: "open",
          per_page: 10,
          ...(labels ? { labels } : {}),
        })
      );
      updateRateLimit(headers as Record<string, string | undefined>);
      return data;
    },

    async fetchRepoReadme(owner: string, repo: string) {
      try {
        const { data, headers } = await requestWithRetry(() =>
          octokit.repos.getReadme({ owner, repo })
        );
        updateRateLimit(headers as Record<string, string | undefined>);
        return Buffer.from(data.content, "base64").toString("utf-8");
      } catch {
        return null;
      }
    },

    async fetchAuthenticatedUser() {
      const { data, headers } = await requestWithRetry(() =>
        octokit.users.getAuthenticated()
      );
      updateRateLimit(headers as Record<string, string | undefined>);
      return data;
    },

    async fetchUser(username: string) {
      const { data, headers } = await requestWithRetry(() =>
        octokit.users.getByUsername({ username })
      );
      updateRateLimit(headers as Record<string, string | undefined>);
      return data;
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
