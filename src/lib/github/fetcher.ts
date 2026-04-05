import { createGitHubClient } from "./client";
import type {
  GitHubProfileData,
  RepoSummary,
  CommitPatterns,
  PullRequestStats,
} from "./types";

export async function fetchGitHubProfile(
  accessToken: string,
  username: string
): Promise<GitHubProfileData> {
  const client = createGitHubClient(accessToken);

  // Fetch user info, repos, events, and PRs in parallel
  const [user, rawRepos, events, rawPRs] = await Promise.all([
    client.fetchUser(username),
    client.fetchUserRepos(username),
    client.fetchUserEvents(username),
    client.fetchUserPRs(username),
  ]);

  // Fetch languages for top 20 repos (by stars) to stay within rate limits
  const topRepos = [...rawRepos]
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, 20);

  const repoLanguages = await Promise.all(
    topRepos.map(async (repo) => {
      const langs = await client.fetchRepoLanguages(
        repo.owner.login,
        repo.name
      );
      return { repoFullName: repo.full_name, languages: langs };
    })
  );

  const repoLangMap = new Map(
    repoLanguages.map((r) => [r.repoFullName, r.languages])
  );

  // Build repo summaries
  const repositories: RepoSummary[] = rawRepos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language ?? null,
    languages: repoLangMap.get(repo.full_name) ?? {},
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    topics: repo.topics ?? [],
    isForked: repo.fork ?? false,
    isMaintainer: repo.owner.login === username,
    createdAt: repo.created_at ?? "",
    updatedAt: repo.updated_at ?? "",
    pushedAt: repo.pushed_at ?? "",
  }));

  // Aggregate languages across all fetched repos
  const languages = aggregateLanguages(repoLanguages.map((r) => r.languages));

  // Analyze commit patterns from events
  const commitPatterns = analyzeCommitPatterns(events);

  // Build PR stats
  const pullRequests = analyzePullRequests(rawPRs);

  // Extract top topics
  const topTopics = extractTopTopics(repositories);

  // Calculate account age
  const accountAge =
    (Date.now() - new Date(user.created_at).getTime()) /
    (1000 * 60 * 60 * 24 * 365);

  return {
    username,
    repositories,
    languages,
    commitPatterns,
    pullRequests,
    topTopics,
    totalStars: repositories.reduce((sum, r) => sum + r.stars, 0),
    totalForks: repositories.reduce((sum, r) => sum + r.forks, 0),
    publicRepoCount: user.public_repos,
    accountAge: Math.round(accountAge * 10) / 10,
  };
}

export function aggregateLanguages(
  repoLanguages: Record<string, number>[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const langs of repoLanguages) {
    for (const [lang, bytes] of Object.entries(langs)) {
      totals[lang] = (totals[lang] ?? 0) + bytes;
    }
  }
  // Sort by bytes descending
  return Object.fromEntries(
    Object.entries(totals).sort(([, a], [, b]) => b - a)
  );
}

export function analyzeCommitPatterns(
  events: { type?: string | null; created_at?: string | null }[]
): CommitPatterns {
  const pushEvents = events.filter((e) => e.type === "PushEvent");

  if (pushEvents.length === 0) {
    return {
      totalCommits: 0,
      avgPerWeek: 0,
      peakDay: "Unknown",
      peakHour: 0,
      activeDays: 0,
      longestStreak: 0,
    };
  }

  const dayCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  const dateSet = new Set<string>();
  let totalCommits = 0;

  for (const event of pushEvents) {
    if (!event.created_at) continue;
    const date = new Date(event.created_at);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const hour = date.getUTCHours();
    const dateStr = date.toISOString().split("T")[0];

    // Each PushEvent can contain multiple commits (payload.size), but
    // the events API doesn't always include payload in typed responses,
    // so we count each push as 1 contribution unit
    totalCommits++;
    dayCounts[dayName] = (dayCounts[dayName] ?? 0) + 1;
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    dateSet.add(dateStr);
  }

  const peakDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "Unknown";
  const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "0";

  // Calculate longest streak
  const sortedDates = [...dateSet].sort();
  let longestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Estimate avg per week based on date range
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const weeks = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  return {
    totalCommits,
    avgPerWeek: Math.round((totalCommits / weeks) * 10) / 10,
    peakDay,
    peakHour: parseInt(String(peakHour)),
    activeDays: dateSet.size,
    longestStreak,
  };
}

export function analyzePullRequests(
  prs: { state?: string; pull_request?: { merged_at?: string | null } }[]
): PullRequestStats {
  let opened = 0;
  let merged = 0;

  for (const pr of prs) {
    opened++;
    if (pr.pull_request?.merged_at) {
      merged++;
    }
  }

  return { opened, merged, reviewed: 0 };
}

export function extractTopTopics(
  repos: RepoSummary[],
  limit = 15
): string[] {
  const topicCounts: Record<string, number> = {};
  for (const repo of repos) {
    for (const topic of repo.topics) {
      topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
    }
  }
  return Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([topic]) => topic);
}
