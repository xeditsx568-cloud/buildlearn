import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lesson-player/mentor-client", () => ({
  fetchMentorQuota: vi.fn().mockResolvedValue({
    remainingThisMonth: 30,
    limitThisMonth: 30,
    resetAt: "2026-11-01T00:00:00.000Z",
  }),
  postMentorHelp: vi.fn(),
  MentorApiError: class MentorApiError extends Error {},
}));

import { AiMentorPanel } from "@/components/lesson-player/ai-mentor-panel";

describe("AiMentorPanel", () => {
  it("renders help actions for Lesson 1", () => {
    const html = renderToStaticMarkup(
      <AiMentorPanel
        lessonId="how-websites-work"
        blockIndex={3}
        learnerCode="<html></html>"
        showStuckPrompt
        variant="sidebar"
      />,
    );

    expect(html).toContain("Get help with this step");
    expect(html).toContain("What is this asking me to do?");
    expect(html).not.toContain("Level 4");
  });

  it("does not render for other lessons", () => {
    const html = renderToStaticMarkup(
      <AiMentorPanel
        lessonId="other-lesson"
        blockIndex={0}
        showStuckPrompt={false}
      />,
    );
    expect(html).toBe("");
  });
});
