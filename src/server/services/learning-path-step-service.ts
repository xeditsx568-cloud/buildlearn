import {
  LearningPathStatus,
  LearningPathStepStatus,
  LearningPathStepType,
  type LearningPath,
  type LearningPathStep,
  type Prisma,
} from "@prisma/client";

import type { LessonPathAccess } from "@/lib/lesson-player/contracts";
import { db } from "@/server/db";

type DbClient = typeof db | Prisma.TransactionClient;

export class PathStepNotFoundError extends Error {
  constructor(message = "Path step not found for this lesson") {
    super(message);
    this.name = "PathStepNotFoundError";
  }
}

export class PathStepLockedError extends Error {
  constructor(message = "This lesson is locked on your roadmap") {
    super(message);
    this.name = "PathStepLockedError";
  }
}

function findLessonStep(
  path: LearningPath & { steps: LearningPathStep[] },
  lessonId: string,
): LearningPathStep | undefined {
  return path.steps.find(
    (step) =>
      step.stepType === LearningPathStepType.lesson &&
      step.referenceId === lessonId,
  );
}

export async function findActivePathWithSteps(userId: string, client: DbClient = db) {
  return client.learningPath.findFirst({
    where: {
      userId,
      status: LearningPathStatus.active,
    },
    include: { steps: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getLessonPathAccess(
  path: (LearningPath & { steps: LearningPathStep[] }) | null,
  lessonId: string,
): LessonPathAccess | null {
  if (!path) {
    return null;
  }

  const step = findLessonStep(path, lessonId);
  if (!step) {
    return null;
  }

  const canOpen =
    step.status === LearningPathStepStatus.available ||
    step.status === LearningPathStepStatus.in_progress ||
    step.status === LearningPathStepStatus.completed;

  return {
    pathStepId: step.id,
    stepStatus: step.status,
    canOpen,
  };
}

export async function assertLessonStepOpenable(
  userId: string,
  lessonId: string,
  client: DbClient = db,
): Promise<LearningPathStep> {
  const path = await findActivePathWithSteps(userId, client);

  if (!path) {
    throw new PathStepNotFoundError("No active learning path");
  }

  const step = findLessonStep(path, lessonId);
  if (!step) {
    throw new PathStepNotFoundError();
  }

  if (
    step.status === LearningPathStepStatus.locked ||
    step.status === LearningPathStepStatus.skipped
  ) {
    throw new PathStepLockedError();
  }

  return step;
}

export async function completeLessonPathStepInTransaction(
  userId: string,
  lessonId: string,
  client: DbClient,
): Promise<{
  completedStep: LearningPathStep;
  nextUnlocked: LearningPathStep | null;
}> {
  const path = await findActivePathWithSteps(userId, client);

  if (!path) {
    throw new PathStepNotFoundError("No active learning path");
  }

  const step = findLessonStep(path, lessonId);
  if (!step) {
    throw new PathStepNotFoundError();
  }

  if (
    step.status === LearningPathStepStatus.locked ||
    step.status === LearningPathStepStatus.skipped
  ) {
    throw new PathStepLockedError();
  }

  const sortedSteps = [...path.steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const alreadyCompleted = step.status === LearningPathStepStatus.completed;

  let completedStep = step;
  if (!alreadyCompleted) {
    completedStep = await client.learningPathStep.update({
      where: { id: step.id },
      data: { status: LearningPathStepStatus.completed },
    });
  }

  const nextStep = sortedSteps.find((s) => s.orderIndex === step.orderIndex + 1);
  let nextUnlocked: LearningPathStep | null = null;

  if (
    nextStep &&
    nextStep.status === LearningPathStepStatus.locked &&
    !alreadyCompleted
  ) {
    nextUnlocked = await client.learningPathStep.update({
      where: { id: nextStep.id },
      data: { status: LearningPathStepStatus.available },
    });
  } else if (
    nextStep &&
    nextStep.status === LearningPathStepStatus.available
  ) {
    nextUnlocked = nextStep;
  }

  return { completedStep, nextUnlocked };
}
