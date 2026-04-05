import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";

export const REPO_SCOUT_SYSTEM_PROMPT = `You are an expert open-source matchmaker. Your job is to find GitHub repositories where a developer's skills are needed most.

You have access to tools to search GitHub repositories and inspect their issues. Use them strategically:

1. Generate 3-5 targeted search queries based on the developer's profile
2. Search for repos using those queries
3. Optionally inspect issues for promising repos

Focus on:
- Repos that actively need contributors (recent activity, open issues, "help wanted" labels)
- Repos that match the developer's primary languages and expertise
- Repos where the developer could make meaningful contributions
- A mix of well-known and smaller repos

Do NOT suggest repos that:
- Are inactive (no updates in 30+ days)
- Have fewer than 10 stars
- Are the developer's own repos

After searching, summarize what you found. The results will be scored in a separate step.`;

export const REPO_SCORER_SYSTEM_PROMPT = `You are scoring GitHub repositories for how well they match a specific developer's profile.

For each repository, assess:
- matchScore (0-100): How well the developer's skills match what the repo needs
- matchReasons: Specific reasons tied to the developer's profile
- estimatedDifficulty: Based on the repo's codebase complexity and issue types
- suggestedIssueLabels: Labels the developer should look for
- hasContributingGuide: Whether the repo likely has contribution guidelines

Be honest with scores. A 90+ score means near-perfect skill alignment with active need. 50-70 is a reasonable match. Below 50 is a stretch.`;

export function buildScoutPrompt(profile: DeveloperProfile): string {
  const languages = profile.primaryLanguages
    .map((l) => `${l.language} (${l.proficiencyLevel})`)
    .join(", ");

  const expertise = profile.expertiseAreas
    .map((e) => `${e.area} (confidence: ${(e.confidence * 100).toFixed(0)}%)`)
    .join(", ");

  const contributions = profile.contributionStyle.preferredContributions.join(", ");

  return `Find open-source projects for this developer:

## Developer Profile
- Summary: ${profile.summary}
- Languages: ${languages}
- Expertise: ${expertise}
- Contribution style: ${profile.contributionStyle.type} - ${profile.contributionStyle.description}
- Preferred contributions: ${contributions}
- Ideal project traits: ${profile.idealProjectTraits.join(", ")}

Search for repositories that match this developer's skills and interests. Use a variety of search queries to cover different aspects of their profile.`;
}

export function buildScoringPrompt(
  profile: DeveloperProfile,
  repos: { fullName: string; description: string | null; language: string | null; stars: number; openIssues: number; topics: string[]; updatedAt: string }[]
): string {
  const repoList = repos
    .map(
      (r) =>
        `- ${r.fullName} (${r.language ?? "unknown"}, ${r.stars}★, ${r.openIssues} issues): ${r.description ?? "No description"} [topics: ${r.topics.join(", ") || "none"}] (updated: ${r.updatedAt})`
    )
    .join("\n");

  return `Score these repositories for the developer described below.

## Developer
- Languages: ${profile.primaryLanguages.map((l) => l.language).join(", ")}
- Expertise: ${profile.expertiseAreas.map((e) => e.area).join(", ")}
- Style: ${profile.contributionStyle.type}
- Preferred: ${profile.contributionStyle.preferredContributions.join(", ")}
- Ideal traits: ${profile.idealProjectTraits.join(", ")}

## Candidate Repositories
${repoList}

Score each repo with a matchScore (0-100), matchReasons, estimatedDifficulty, and suggestedIssueLabels. Only include repos scoring 40 or above.`;
}
