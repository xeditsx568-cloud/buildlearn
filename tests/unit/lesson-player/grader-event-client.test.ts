import { afterEach, describe, expect, it, vi } from "vitest";

import {
  postMentorGraderEvent,
  syncMentorGraderEvent,
} from "@/lib/lesson-player/grader-event-client";

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

describe("syncMentorGraderEvent block scope (B-W2-02)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores stale grader-event result after active block changes", async () => {
    const pending = new Promise<{
      passed: boolean;
      message: string;
      blockState: {
        failedChecksSinceLastPass: number;
        lastLevelDelivered: number;
        helpTurnCount: number;
      };
    }>((resolve) => {
      setTimeout(
        () =>
          resolve({
            passed: false,
            message: "Add comments",
            blockState: {
              failedChecksSinceLastPass: 99,
              lastLevelDelivered: 0,
              helpTurnCount: 0,
            },
          }),
        0,
      );
    });

    const fetchMock = vi.fn().mockReturnValue({
      ok: true,
      json: () => pending,
    });
    vi.stubGlobal("fetch", fetchMock);

    let activeBlockIndex = 3;
    const onSuccess = vi.fn();

    syncMentorGraderEvent(
      {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html></html>",
      },
      (result) => {
        onSuccess(result.blockState.failedChecksSinceLastPass);
      },
      {
        getActiveScope: () => ({
          lessonId: "how-websites-work",
          blockIndex: activeBlockIndex,
        }),
      },
    );

    activeBlockIndex = 4;
    await pending;

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("applies grader-event result when still on the same block", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        passed: false,
        message: "Add comments",
        blockState: {
          failedChecksSinceLastPass: 2,
          lastLevelDelivered: 0,
          helpTurnCount: 0,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();

    syncMentorGraderEvent(
      {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html></html>",
      },
      (result) => {
        onSuccess(result.blockState.failedChecksSinceLastPass);
      },
      {
        getActiveScope: () => ({
          lessonId: "how-websites-work",
          blockIndex: 3,
        }),
      },
    );

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(2));
  });
});
