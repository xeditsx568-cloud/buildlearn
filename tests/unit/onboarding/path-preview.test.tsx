import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PathPreviewScreenStatic } from "@/components/onboarding/path-preview-screen";
import { getStartLearningHref } from "@/components/onboarding/path-preview-view";
import { ONBOARDING_COMPLETION_ROUTE } from "@/lib/onboarding/constants";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const sampleSteps = [
  {
    orderIndex: 0,
    displayTitle: "How Websites Work",
    stepType: "lesson",
    status: "available",
  },
  {
    orderIndex: 1,
    displayTitle: "Profile Card Challenge",
    stepType: "challenge",
    status: "locked",
  },
];

describe("path preview states", () => {
  it("renders loading state copy and skeleton rows", () => {
    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic status="loading" />,
    );

    expect(html).toContain("Generating your personalized path");
    expect(html).toContain("This usually takes a few seconds.");
    expect(html).toContain("animate-pulse");
  });

  it("renders error state copy and retry action", () => {
    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic status="error" />,
    );

    expect(html).toContain("We couldn&#x27;t generate your path.");
    expect(html).toContain("Try again");
    expect(html).toContain("Contact support");
  });

  it("renders loaded preview with persisted path steps", () => {
    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic
        status="loaded"
        goalText="A bakery landing page"
        steps={sampleSteps}
      />,
    );

    expect(html).toContain("Your learning path");
    expect(html).toContain("Goal: A bakery landing page");
    expect(html).toContain("How Websites Work");
    expect(html).toContain("Profile Card Challenge");
    expect(html).toContain("deterministic v1");
  });

  it("targets /roadmap from Start learning CTA", () => {
    expect(getStartLearningHref()).toBe("/roadmap");
    expect(ONBOARDING_COMPLETION_ROUTE).toBe("/roadmap");

    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic status="loaded" steps={sampleSteps} />,
    );

    expect(html).toContain("Start learning →");
    expect(html).toContain("<button");
  });
});
