import { beforeEach, describe, expect, it, vi } from "vitest";

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

const INTERACT_STARTER = L1_LESSON_PAYLOAD.blocks[2]!.type === "interact"
  ? L1_LESSON_PAYLOAD.blocks[2]!.starterCode
  : "";

describe("processMentorGraderEvent", () => {
  let store: InMemoryMentorBlockStateStore;

  beforeEach(() => {
    store = new InMemoryMentorBlockStateStore();
    mockAssertMentorLessonAccess.mockResolvedValue(L1_LESSON_PAYLOAD);
  });

  it("increments fail count for genuinely failing exercise code", async () => {
    const result = await processMentorGraderEvent({
      userId: "user_a",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html><head></head><body></body></html>",
      },
      stateStore: store,
    });

    expect(result.passed).toBe(false);
    expect(result.blockState.failedChecksSinceLastPass).toBe(1);
  });

  it("resets fail count on passing exercise code", async () => {
    await processMentorGraderEvent({
      userId: "user_a",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html><head></head><body></body></html>",
      },
      stateStore: store,
    });

    const passCode = `<!-- document -->
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

    const result = await processMentorGraderEvent({
      userId: "user_a",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: passCode,
      },
      stateStore: store,
    });

    expect(result.passed).toBe(true);
    expect(result.blockState.failedChecksSinceLastPass).toBe(0);
  });

  it("isolates state by user and block", async () => {
    await processMentorGraderEvent({
      userId: "user_a",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html><head></head><body></body></html>",
      },
      stateStore: store,
    });

    const otherUser = await processMentorGraderEvent({
      userId: "user_b",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        learnerCode: "<html><head></head><body></body></html>",
      },
      stateStore: store,
    });

    expect(otherUser.blockState.failedChecksSinceLastPass).toBe(1);

    const interactFail = await processMentorGraderEvent({
      userId: "user_a",
      body: {
        lessonId: "how-websites-work",
        blockIndex: 2,
        learnerCode: INTERACT_STARTER,
      },
      stateStore: store,
    });

    expect(interactFail.blockState.failedChecksSinceLastPass).toBe(1);
  });
});
