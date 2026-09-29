import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LearningPathStatus,
  LearningPathStepStatus,
  LearningPathStepType,
  PathGeneratedBy,
} from "@prisma/client";

const mockFindFirst = vi.fn();
const mockStepUpdate = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    learningPath: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    learningPathStep: {
      update: (...args: unknown[]) => mockStepUpdate(...args),
    },
  },
}));

import { completeLessonPathStepInTransaction } from "@/server/services/learning-path-step-service";

const pathId = "path_1";
const userId = "user_1";

const basePath = {
  id: pathId,
  userId,
  goalTemplateId: "business-website",
  status: LearningPathStatus.active,
  generatedBy: PathGeneratedBy.system,
  metadata: {},
  createdAt: new Date(),
  steps: [
    {
      id: "step_0",
      pathId,
      orderIndex: 0,
      stepType: LearningPathStepType.lesson,
      referenceId: "how-websites-work",
      status: LearningPathStepStatus.available,
      metadata: {},
    },
    {
      id: "step_1",
      pathId,
      orderIndex: 1,
      stepType: LearningPathStepType.lesson,
      referenceId: "your-first-html-page",
      status: LearningPathStepStatus.locked,
      metadata: {},
    },
  ],
};

describe("completeLessonPathStepInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(basePath);
    mockStepUpdate.mockImplementation(({ where, data }: { where: { id: string }; data: { status: LearningPathStepStatus } }) => {
      const step = basePath.steps.find((s) => s.id === where.id);
      return Promise.resolve({ ...step!, status: data.status });
    });
  });

  it("marks lesson step completed and unlocks the next step", async () => {
    const result = await completeLessonPathStepInTransaction(
      userId,
      "how-websites-work",
      {
        learningPath: { findFirst: mockFindFirst },
        learningPathStep: { update: mockStepUpdate },
      } as never,
    );

    expect(result.completedStep.status).toBe(LearningPathStepStatus.completed);
    expect(result.nextUnlocked?.referenceId).toBe("your-first-html-page");
    expect(result.nextUnlocked?.status).toBe(LearningPathStepStatus.available);
    expect(mockStepUpdate).toHaveBeenCalledTimes(2);
  });

  it("is idempotent when the lesson step is already completed", async () => {
    mockFindFirst.mockResolvedValue({
      ...basePath,
      steps: [
        { ...basePath.steps[0]!, status: LearningPathStepStatus.completed },
        { ...basePath.steps[1]!, status: LearningPathStepStatus.available },
      ],
    });

    const result = await completeLessonPathStepInTransaction(
      userId,
      "how-websites-work",
      {
        learningPath: { findFirst: mockFindFirst },
        learningPathStep: { update: mockStepUpdate },
      } as never,
    );

    expect(result.completedStep.status).toBe(LearningPathStepStatus.completed);
    expect(mockStepUpdate).not.toHaveBeenCalled();
  });
});
