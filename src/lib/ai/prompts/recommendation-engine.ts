import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import type { CandidateRepo } from "@/lib/ai/schemas/candidate-repo";

export const RECOMMENDATION_SYSTEM_PROMPT = `You are an expert open-source contribution advisor. Your job is to generate actionable, personalized recommendations that help a developer make their first contribution to a repository.

For each repository, you must provide:
1. A compelling headline explaining why this repo needs this specific developer
2. Concrete reasons why the developer is a good fit (tied to their actual skills)
3. A specific first contribution plan with actionable steps

Guidelines:
- Be specific, not generic. "Your TypeScript expertise matches their migration from JS" is better than "You know the language"
- For firstContribution, suggest real, achievable tasks. Prefer issues labeled "good first issue" or "help wanted" when available
- If no suitable issues exist, suggest documentation improvements, test additions, or small refactors
- estimatedEffort should be realistic — most first contributions are "< 1 hour" or "1-3 hours"
- Tags should reflect the nature of the contribution opportunity (e.g., "typescript", "react", "documentation", "testing")`;

export function buildRecommendationPrompt(
  profile: DeveloperProfile,
  candidates: CandidateRepo[],
  repoDetails: Map<
    string,
    {
      readme: string | null;
      issues: { title: string; labels: string[]; url: string }[];
    }
  >
): string {
  const profileSummary = `## Developer Profile
- Summary: ${profile.summary}
- Languages: ${profile.primaryLanguages.map((l) => `${l.language} (${l.proficiencyLevel})`).join(", ")}
- Expertise: ${profile.expertiseAreas.map((e) => e.area).join(", ")}
- Style: ${profile.contributionStyle.type} — ${profile.contributionStyle.description}
- Preferred contributions: ${profile.contributionStyle.preferredContributions.join(", ")}`;

  const repoSections = candidates
    .map((c) => {
      const details = repoDetails.get(c.repoFullName);
      const readmeSnippet = details?.readme
        ? details.readme.slice(0, 500) + (details.readme.length > 500 ? "..." : "")
        : "No README available";
      const issueList =
        details?.issues && details.issues.length > 0
          ? details.issues
              .map((i) => `    - [${i.labels.join(", ")}] ${i.title} (${i.url})`)
              .join("\n")
          : "    No relevant issues found";

      return `### ${c.repoFullName} (${c.primaryLanguage}, ${c.stars}★, score: ${c.matchScore})
  Description: ${c.description}
  Match reasons: ${c.matchReasons.join("; ")}
  README excerpt: ${readmeSnippet}
  Open issues:
${issueList}`;
    })
    .join("\n\n");

  return `${profileSummary}

## Candidate Repositories
${repoSections}

Generate a personalized recommendation for each repository above. Focus on actionable first contributions.`;
}
