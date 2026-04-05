import type { GitHubClient } from "./client";

export interface SearchRepoResult {
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  updatedAt: string;
  hasWiki: boolean;
  license: string | null;
  owner: string;
}

export interface RepoIssue {
  number: number;
  title: string;
  url: string;
  labels: string[];
  createdAt: string;
  comments: number;
}

export async function searchRepositories(
  client: GitHubClient,
  query: string,
  options: { sort?: "stars" | "updated" | "help-wanted-issues"; perPage?: number } = {}
): Promise<SearchRepoResult[]> {
  const { sort = "stars", perPage = 20 } = options;

  const results = await client.searchRepos(query, sort, perPage);

  return results.map((repo) => ({
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at ?? "",
    hasWiki: repo.has_wiki ?? false,
    license: repo.license?.spdx_id ?? null,
    owner: repo.owner?.login ?? "",
  }));
}

export async function getRepoIssues(
  client: GitHubClient,
  owner: string,
  repo: string,
  labels?: string
): Promise<RepoIssue[]> {
  const issues = await client.fetchRepoIssues(owner, repo, labels);

  return issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    labels: issue.labels
      .map((l) => (typeof l === "string" ? l : l.name ?? ""))
      .filter(Boolean),
    createdAt: issue.created_at ?? "",
    comments: issue.comments ?? 0,
  }));
}

export function filterCandidates(
  repos: SearchRepoResult[],
  username: string,
  options: { minStars?: number } = {}
): SearchRepoResult[] {
  const { minStars = 10 } = options;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return repos.filter((repo) => {
    // Exclude user's own repos
    if (repo.owner.toLowerCase() === username.toLowerCase()) return false;
    // Exclude repos with too few stars
    if (repo.stars < minStars) return false;
    // Exclude inactive repos (not updated in 30 days)
    if (new Date(repo.updatedAt) < thirtyDaysAgo) return false;
    return true;
  });
}
