import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import type { Recommendation } from "@/lib/ai/schemas/recommendation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/actions/update-recommendation", () => ({
  updateRecommendationStatus: vi.fn(),
}));

const mockRec: Recommendation = {
  repoFullName: "vercel/ai",
  repoUrl: "https://github.com/vercel/ai",
  headline: "Your TypeScript expertise is perfect for the AI SDK",
  whyYoureAFit: [
    "Expert TypeScript aligns with the codebase",
    "React experience for streaming UI components",
  ],
  firstContribution: {
    type: "issue",
    title: "Fix type inference for tool parameters",
    description: "Update the generic constraints in src/core/tool.ts.",
    issueUrl: "https://github.com/vercel/ai/issues/1234",
    estimatedEffort: "1-3 hours",
    filesLikelyInvolved: ["src/core/tool.ts"],
  },
  matchScore: 88,
  tags: ["typescript", "ai", "react"],
};

describe("RecommendationCard", () => {
  it("renders compact card with repo name, headline, and score", () => {
    const { container } = render(
      <RecommendationCard id="rec-1" recommendation={mockRec} status="new" />
    );
    const html = container.innerHTML;

    expect(html).toContain("vercel/ai");
    expect(html).toContain("Your TypeScript expertise is perfect for the AI SDK");
    expect(html).toContain("88%");
  });

  it("renders tags on the compact card", () => {
    const { container } = render(
      <RecommendationCard id="rec-1" recommendation={mockRec} status="new" />
    );
    expect(container.innerHTML).toContain("typescript");
  });

  it("shows save and dismiss buttons for new recommendations", () => {
    const { container } = render(
      <RecommendationCard id="rec-1" recommendation={mockRec} status="new" />
    );
    expect(container.innerHTML).toContain("Save");
    expect(container.innerHTML).toContain("Dismiss");
  });

  it("hides action buttons for dismissed recommendations", () => {
    const { container } = render(
      <RecommendationCard id="rec-1" recommendation={mockRec} status="dismissed" />
    );
    // Card should not contain Save/Dismiss buttons (only the Saved badge or nothing)
    const buttons = container.querySelectorAll("button");
    const buttonTexts = Array.from(buttons).map((b) => b.textContent);
    expect(buttonTexts).not.toContain("Save");
    expect(buttonTexts).not.toContain("Dismiss");
  });

  it("opens detail modal when card is clicked", () => {
    const { container, getByRole } = render(
      <RecommendationCard id="rec-1" recommendation={mockRec} status="new" />
    );

    // Click the card
    const card = container.querySelector('[data-slot="card"]');
    if (card) fireEvent.click(card);

    // Modal should be open with detailed content
    const dialog = getByRole("dialog");
    expect(dialog.innerHTML).toContain("Why you're a fit");
    expect(dialog.innerHTML).toContain("Expert TypeScript aligns with the codebase");
    expect(dialog.innerHTML).toContain("Fix type inference for tool parameters");
    expect(dialog.innerHTML).toContain("1-3 hours");
    expect(dialog.innerHTML).toContain("src/core/tool.ts");
    expect(dialog.innerHTML).toContain("View Repository");
  });
});
