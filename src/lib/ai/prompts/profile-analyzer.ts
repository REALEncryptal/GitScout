import type { GitHubProfileData } from "@/lib/github/types";

export const PROFILE_ANALYZER_SYSTEM_PROMPT = `You are an expert developer talent analyst. Your job is to analyze a developer's GitHub profile data and produce a structured assessment of their skills, expertise, and contribution style.

Be specific and evidence-based. Every claim should be backed by data from their profile. Do not make generic statements — tie your analysis to their actual repositories, languages, commit patterns, and contributions.

Guidelines:
- Assess language proficiency based on bytes written, number of repos, and recency
- Identify expertise areas from repo topics, descriptions, and language combinations
- Characterize their contribution style based on commit patterns and PR activity
- Suggest ideal project traits based on what they've historically worked on
- Be honest about proficiency levels — don't inflate. A few hundred lines of a language is "beginner", not "intermediate"
- Focus on what makes this developer unique and valuable`;

export function buildProfilePrompt(profile: GitHubProfileData): string {
  const languageBreakdown = Object.entries(profile.languages)
    .slice(0, 10)
    .map(([lang, bytes]) => `  - ${lang}: ${(bytes / 1024).toFixed(0)} KB`)
    .join("\n");

  const topRepos = profile.repositories
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 15)
    .map(
      (r) =>
        `  - ${r.fullName} (${r.language ?? "unknown"}, ${r.stars}★, ${r.forks} forks): ${r.description ?? "No description"} [topics: ${r.topics.join(", ") || "none"}]`
    )
    .join("\n");

  const repoLanguageDetails = profile.repositories
    .filter((r) => Object.keys(r.languages).length > 0)
    .slice(0, 10)
    .map(
      (r) =>
        `  - ${r.name}: ${Object.entries(r.languages)
          .map(([l, b]) => `${l} (${(b / 1024).toFixed(0)}KB)`)
          .join(", ")}`
    )
    .join("\n");

  return `Analyze this developer's GitHub profile:

## Developer: ${profile.username}
- Account age: ${profile.accountAge} years
- Public repos: ${profile.publicRepoCount}
- Total stars: ${profile.totalStars}
- Total forks: ${profile.totalForks}

## Language Breakdown (by bytes written):
${languageBreakdown || "  No language data available"}

## Top Repositories:
${topRepos || "  No repositories found"}

## Repo Language Details:
${repoLanguageDetails || "  No detailed language data"}

## Commit Patterns:
  - Total push events: ${profile.commitPatterns.totalCommits}
  - Avg per week: ${profile.commitPatterns.avgPerWeek}
  - Peak day: ${profile.commitPatterns.peakDay}
  - Peak hour (UTC): ${profile.commitPatterns.peakHour}
  - Active days: ${profile.commitPatterns.activeDays}
  - Longest streak: ${profile.commitPatterns.longestStreak} days

## Pull Request Activity:
  - PRs opened: ${profile.pullRequests.opened}
  - PRs merged: ${profile.pullRequests.merged}

## Top Topics: ${profile.topTopics.join(", ") || "none"}

Based on this data, produce a detailed developer profile assessment.`;
}
