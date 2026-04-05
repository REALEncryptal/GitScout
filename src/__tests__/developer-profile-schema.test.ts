import { describe, it, expect } from "vitest";
import { developerProfileSchema } from "@/lib/ai/schemas/developer-profile";

const validProfile = {
  summary:
    "A full-stack TypeScript developer specializing in React and Node.js with 5 years of experience building web applications.",
  primaryLanguages: [
    {
      language: "TypeScript",
      proficiencyLevel: "expert" as const,
      evidence: "50+ repos, 200K+ bytes written, used across all major projects",
    },
    {
      language: "Python",
      proficiencyLevel: "intermediate" as const,
      evidence: "5 repos with Python, mostly scripting and data analysis",
    },
  ],
  expertiseAreas: [
    {
      area: "React state management",
      confidence: 0.9,
      evidence: "Multiple repos using Redux, Zustand, and React Context",
    },
    {
      area: "CLI tooling",
      confidence: 0.7,
      evidence: "3 CLI tools built with Node.js",
    },
  ],
  contributionStyle: {
    type: "maintainer" as const,
    description: "Primarily maintains own projects with occasional contributions to others",
    preferredContributions: ["features" as const, "bug-fixes" as const],
  },
  commitPatterns: {
    frequency: "regular" as const,
    qualityAssessment: "Consistent daily commits with clear messages",
  },
  idealProjectTraits: [
    "TypeScript-first codebase",
    "Active community with good documentation",
    "Web application or developer tooling",
  ],
};

describe("developerProfileSchema", () => {
  it("validates a well-formed profile", () => {
    const result = developerProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("rejects missing summary", () => {
    const { summary: _, ...noSummary } = validProfile;
    const result = developerProfileSchema.safeParse(noSummary);
    expect(result.success).toBe(false);
  });

  it("rejects invalid proficiency level", () => {
    const invalid = {
      ...validProfile,
      primaryLanguages: [
        {
          language: "TypeScript",
          proficiencyLevel: "godlike",
          evidence: "test",
        },
      ],
    };
    const result = developerProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects confidence outside 0-1 range", () => {
    const invalid = {
      ...validProfile,
      expertiseAreas: [
        { area: "Test", confidence: 1.5, evidence: "test" },
      ],
    };
    const result = developerProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 primary languages", () => {
    const invalid = {
      ...validProfile,
      primaryLanguages: Array(6).fill({
        language: "Test",
        proficiencyLevel: "beginner",
        evidence: "test",
      }),
    };
    const result = developerProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid contribution style type", () => {
    const invalid = {
      ...validProfile,
      contributionStyle: {
        ...validProfile.contributionStyle,
        type: "wizard",
      },
    };
    const result = developerProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 6 ideal project traits", () => {
    const invalid = {
      ...validProfile,
      idealProjectTraits: Array(7).fill("trait"),
    };
    const result = developerProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
