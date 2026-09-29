import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonProgressStatus } from "@prisma/client";

const mockTransaction = vi.fn();
const mockLessonFindUnique = vi.fn();
const mockLessonProgressUpsert = vi.fn();
const mockLessonProgressFindUnique = vi.fn();
const mockAssertOpen = vi.fn();
const mockCompletePath = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    lesson: { findUnique: (...args: unknown[]) => mockLessonFindUnique(...args) },
    lessonProgress: {
      findUnique: (...args: unknown[]) => mockLessonProgressFindUnique(...args),
      upsert: (...args: unknown[]) => mockLessonProgressUpsert(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

vi.mock("@/server/services/learning-path-step-service", () => ({
  assertLessonStepOpenable: (...args: unknown[]) => mockAssertOpen(...args),
  completeLessonPathStepInTransaction: (...args: unknown[]) =>
    mockCompletePath(...args),
  findActivePathWithSteps: vi.fn(),
  getLessonPathAccess: vi.fn(),
}));

vi.mock("@/server/services/lesson-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services/lesson-service")>();
  return {
    ...actual,
    getLessonPlayerPayload: vi.fn(),
  };
});

import { getLessonPlayerPayload } from "@/server/services/lesson-service";
import {
  completeLessonForUser,
  LessonCompletePreconditionError,
} from "@/server/services/lesson-progress-service";

const lessonPayload = {
  id: "how-websites-work",
  title: "How Websites Work",
  estimatedMinutes: 8,
  version: 1,
  conceptIds: ["how-web-works"],
  blocks: [],
};

describe("completeLessonForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLessonPlayerPayload).mockResolvedValue(lessonPayload);
    mockAssertOpen.mockResolvedValue({ id: "step_0" });
    mockLessonProgressUpsert.mockResolvedValue({
      userId: "user_1",
      lessonId: "how-websites-work",
      status: LessonProgressStatus.completed,
      blocksCompleted: [2, 3, 4],
      quizScore: 1,
      hintsUsed: 0,
      completedAt: new Date("2026-09-29T00:00:00.000Z"),
    });
    mockCompletePath.mockResolvedValue({
      completedStep: {
        id: "step_0",
        referenceId: "how-websites-work",
        orderIndex: 0,
      },
      nextUnlocked: {
        id: "step_1",
        referenceId: "your-first-html-page",
        orderIndex: 1,
      },
    });
    mockTransaction.mockImplementation(async (fn) =>
      fn({
        lessonProgress: { upsert: mockLessonProgressUpsert },
      }),
    );
  });

  it("rejects completion when required blocks are missing", async () => {
    await expect(
      completeLessonForUser("user_1", "how-websites-work", {
        blocksCompleted: [2],
        quizScore: 1,
      }),
    ).rejects.toBeInstanceOf(LessonCompletePreconditionError);
  });

  it("completes lesson and returns path unlock summary", async () => {
    const result = await completeLessonForUser("user_1", "how-websites-work", {
      blocksCompleted: [2, 3, 4],
      quizScore: 1,
    });

    expect(result.pathStepCompleted.referenceId).toBe("how-websites-work");
    expect(result.nextStepUnlocked?.referenceId).toBe("your-first-html-page");
    expect(mockCompletePath).toHaveBeenCalled();
  });
});
