import { describe, expect, it, vi } from "vitest";

import { applyBillableHelpDelivered, maxEligibleLevel } from "@/ai/mentor/help-policy";
import { InMemoryMentorBlockStateStore } from "@/server/services/mentor-block-state-store";
import { L1_LESSON_PAYLOAD } from "../fixtures/l1-lesson-payload";

const mockAssertMentorLessonAccess = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/mentor-access-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/services/mentor-access-service")>();
  return {
    ...actual,
    assertMentorLessonAccess: mockAssertMentorLessonAccess,
  };
});

import { processMentorGraderEvent } from "@/server/services/mentor-grader-event-service";

const PASS_CODE = `<!-- document -->
<html lang="en">
<!-- head section -->
<head>
<meta charset="UTF-8" />
<title>How Websites Work</title>
</head>
<!-- body section -->
<body>
<h1>How Websites Work</h1>
</body>
</html>`;

describe("grader trust integration", () => {
  mockAssertMentorLessonAccess.mockResolvedValue(L1_LESSON_PAYLOAD);

  it("repeated passing grader events cannot reach level 4 eligibility", async () => {
    const store = new InMemoryMentorBlockStateStore();
    const userId = "trust_user";

    for (let i = 0; i < 5; i++) {
      await processMentorGraderEvent({
        userId,
        body: {
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: PASS_CODE,
        },
        stateStore: store,
      });
    }

    let state = await store.get({
      userId,
      lessonId: "how-websites-work",
      blockIndex: 3,
    });
    state = applyBillableHelpDelivered(
      { ...state, failedChecksSinceLastPass: 2, helpTurnCount: 1 },
      3,
    );
    await store.set(
      { userId, lessonId: "how-websites-work", blockIndex: 3 },
      state,
    );

    const afterPass = await store.get({
      userId,
      lessonId: "how-websites-work",
      blockIndex: 3,
    });
    expect(maxEligibleLevel(afterPass)).toBeLessThan(4);
  });

  it("genuine failures enable higher eligibility per policy", async () => {
    const store = new InMemoryMentorBlockStateStore();
    const userId = "trust_fail";

    await processMentorGraderEvent({
      userId,
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html><head></head><body></body></html>",
      },
      stateStore: store,
    });

    const state = await store.get({
      userId,
      lessonId: "how-websites-work",
      blockIndex: 3,
    });
    expect(maxEligibleLevel(state)).toBe(2);
    expect(state.failedChecksSinceLastPass).toBe(1);
  });
});
