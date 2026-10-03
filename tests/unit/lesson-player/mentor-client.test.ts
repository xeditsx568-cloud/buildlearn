import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MentorApiError,
  postMentorHelp,
} from "@/lib/lesson-player/mentor-client";

describe("postMentorHelp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads fallback response source header", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: (name: string) => (name === "X-Mentor-Response-Source" ? "fallback" : null) },
        json: async () => ({
          helpLevel: 1,
          message: "Static help",
          quota: { remainingThisMonth: 30, resetAt: "2026-11-01T00:00:00.000Z" },
          suggestedActions: ["try_again"],
        }),
      }),
    );

    const { source, data } = await postMentorHelp({
      lessonId: "how-websites-work",
      blockIndex: 3,
      action: "get_help",
    });

    expect(source).toBe("fallback");
    expect(data.message).toContain("Static");
  });

  it("maps quota exhausted to MentorApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: { get: () => "3600" },
        json: async () => ({
          error: "Monthly mentor quota exceeded",
          code: "quota_exhausted",
        }),
      }),
    );

    await expect(
      postMentorHelp({
        lessonId: "how-websites-work",
        blockIndex: 3,
        action: "get_help",
      }),
    ).rejects.toMatchObject({
      name: "MentorApiError",
      status: 429,
      code: "quota_exhausted",
    } satisfies Partial<MentorApiError>);
  });
});
