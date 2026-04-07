import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProfileCard } from "@/components/dashboard/profile-card";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";

const mockProfile: DeveloperProfile = {
  summary: "A skilled TypeScript developer focused on React and Node.js",
  primaryLanguages: [
    { language: "TypeScript", proficiencyLevel: "expert", evidence: "50+ repos" },
    { language: "Python", proficiencyLevel: "intermediate", evidence: "5 repos" },
  ],
  expertiseAreas: [
    { area: "React", confidence: 0.9, evidence: "Main framework" },
    { area: "CLI tooling", confidence: 0.7, evidence: "3 CLI tools" },
  ],
  contributionStyle: {
    type: "maintainer",
    description: "Maintains own projects with regular updates",
    preferredContributions: ["features", "bug-fixes"],
  },
  commitPatterns: { frequency: "regular", qualityAssessment: "Consistent daily commits" },
  idealProjectTraits: ["TypeScript-first", "Active community"],
};

describe("ProfileCard", () => {
  it("renders all key profile information", () => {
    const { container } = render(
      <ProfileCard profile={mockProfile} username="testuser" />
    );
    const html = container.innerHTML;

    // Username
    expect(html).toContain("@testuser");
    // Title
    expect(html).toContain("Developer Profile");
    // Languages
    expect(html).toContain("TypeScript");
    expect(html).toContain("expert");
    expect(html).toContain("Python");
    expect(html).toContain("intermediate");
    // Expertise
    expect(html).toContain("CLI tooling");
    expect(html).toContain("90%");
    // Contribution style
    expect(html).toContain("maintainer");
    expect(html).toContain("features");
    expect(html).toContain("bug-fixes");
    // Ideal traits
    expect(html).toContain("TypeScript-first");
    expect(html).toContain("Active community");
  });
});
