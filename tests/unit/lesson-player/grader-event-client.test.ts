import { afterEach, describe, expect, it, vi } from "vitest";

import { postMentorGraderEvent } from "@/lib/lesson-player/grader-event-client";

describe("postMentorGraderEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends learnerCode without passed field", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        passed: false,
        message: "Add comments",
        blockState: {
          failedChecksSinceLastPass: 1,
          lastLevelDelivered: 0,
          helpTurnCount: 0,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await postMentorGraderEvent({
      lessonId: "how-websites-work",
      blockIndex: 3,
      learnerCode: "<html></html>",
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body.learnerCode).toBe("<html></html>");
    expect(body).not.toHaveProperty("passed");
  });
});
