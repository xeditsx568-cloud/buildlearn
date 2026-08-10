import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PathPreviewScreenStatic } from "@/components/onboarding/path-preview-screen";
import { getStartLearningHref } from "@/components/onboarding/path-preview-view";
import { ONBOARDING_COMPLETION_ROUTE } from "@/lib/onboarding/constants";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("path preview states", () => {
  it("renders loading state copy and skeleton rows", () => {
    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic status="loading" />,
    );

    expect(html).toContain("Generating your personalized path");
    expect(html).toContain("This usually takes 10–20 seconds.");
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

  it("renders loaded preview with stub path data", () => {
    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic
        status="loaded"
        goalText="A bakery landing page"
      />,
    );

    expect(html).toContain("Your learning path");
    expect(html).toContain("Goal: A bakery landing page");
    expect(html).toContain("How Websites Work");
    expect(html).toContain("Profile Card Challenge");
    expect(html).toContain("Preview uses stub data");
  });

  it("targets /roadmap from Start learning CTA", () => {
    expect(getStartLearningHref()).toBe("/roadmap");
    expect(ONBOARDING_COMPLETION_ROUTE).toBe("/roadmap");

    const html = renderToStaticMarkup(
      <PathPreviewScreenStatic status="loaded" />,
    );

    expect(html).toContain('href="/roadmap"');
    expect(html).toContain("Start learning →");
  });
});
