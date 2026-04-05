export interface RepoSummary {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  isForked: boolean;
  isMaintainer: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface CommitPatterns {
  totalCommits: number;
  avgPerWeek: number;
  peakDay: string;
  peakHour: number;
  activeDays: number;
  longestStreak: number;
}

export interface PullRequestStats {
  opened: number;
  merged: number;
  reviewed: number;
}

export interface GitHubProfileData {
  username: string;
  repositories: RepoSummary[];
  languages: Record<string, number>;
  commitPatterns: CommitPatterns;
  pullRequests: PullRequestStats;
  topTopics: string[];
  totalStars: number;
  totalForks: number;
  publicRepoCount: number;
  accountAge: number; // years
}
