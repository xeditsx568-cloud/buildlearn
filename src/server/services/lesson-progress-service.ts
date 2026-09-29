import { LessonProgressStatus, type LessonProgress } from "@prisma/client";
import { z } from "zod";

import type {
  CompleteLessonResponse,
  LessonProgressRecord,
  LessonWithAccessResponse,
  PatchLessonProgressInput,
} from "@/lib/lesson-player/contracts";
import { db } from "@/server/db";
import {
  assertLessonStepOpenable,
  completeLessonPathStepInTransaction,
  findActivePathWithSteps,
  getLessonPathAccess,
  PathStepLockedError,
  PathStepNotFoundError,
} from "@/server/services/learning-path-step-service";
import {
  getLessonPlayerPayload,
  LessonNotFoundError,
} from "@/server/services/lesson-service";

export class LessonProgressNotFoundError extends Error {
  constructor(message = "Lesson progress not found") {
    super(message);
    this.name = "LessonProgressNotFoundError";
  }
}

export class LessonProgressValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonProgressValidationError";
  }
}

export class LessonCompletePreconditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonCompletePreconditionError";
  }
}

const patchLessonProgressSchema = z
  .object({
    status: z.literal("started").optional(),
    blocksCompleted: z.array(z.number().int().min(0)).optional(),
    quizScore: z.number().min(0).max(1).nullable().optional(),
    hintsUsed: z.number().int().min(0).optional(),
  })
  .strict();

export function parsePatchLessonProgressInput(
  payload: unknown,
): PatchLessonProgressInput {
  const result = patchLessonProgressSchema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    throw new LessonProgressValidationError(message || "Invalid request body");
  }

  if (Object.keys(result.data).length === 0) {
    throw new LessonProgressValidationError("At least one field is required");
  }

  return result.data;
}

function toLessonProgressRecord(row: LessonProgress): LessonProgressRecord {
  const blocksCompleted = row.blocksCompleted as number[];

  return {
    lessonId: row.lessonId,
    status: row.status,
    blocksCompleted: Array.isArray(blocksCompleted) ? blocksCompleted : [],
    quizScore: row.quizScore,
    hintsUsed: row.hintsUsed,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function getLessonWithAccessForUser(
  userId: string,
  lessonId: string,
): Promise<LessonWithAccessResponse> {
  const lesson = await getLessonPlayerPayload(lessonId);
  const path = await findActivePathWithSteps(userId);
  const pathAccess = getLessonPathAccess(path, lessonId);

  if (pathAccess && !pathAccess.canOpen) {
    throw new PathStepLockedError();
  }

  const progressRow = await db.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });

  return {
    lesson,
    progress: progressRow ? toLessonProgressRecord(progressRow) : null,
    pathAccess,
  };
}

export async function getLessonProgressForUser(
  userId: string,
  lessonId: string,
): Promise<LessonProgressRecord> {
  const row = await db.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });

  if (!row) {
    throw new LessonProgressNotFoundError();
  }

  return toLessonProgressRecord(row);
}

export async function patchLessonProgressForUser(
  userId: string,
  lessonId: string,
  input: PatchLessonProgressInput,
): Promise<LessonProgressRecord> {
  await getLessonPlayerPayload(lessonId);
  await assertLessonStepOpenable(userId, lessonId);

  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing?.status === LessonProgressStatus.completed) {
    return toLessonProgressRecord(existing);
  }

  const blocksCompleted =
    input.blocksCompleted ?? (existing?.blocksCompleted as number[] | undefined) ?? [];

  const row = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      status: input.status ?? LessonProgressStatus.started,
      blocksCompleted,
      quizScore: input.quizScore ?? null,
      hintsUsed: input.hintsUsed ?? 0,
    },
    update: {
      status: input.status ?? existing?.status ?? LessonProgressStatus.started,
      ...(input.blocksCompleted !== undefined ? { blocksCompleted } : {}),
      ...(input.quizScore !== undefined ? { quizScore: input.quizScore } : {}),
      ...(input.hintsUsed !== undefined ? { hintsUsed: input.hintsUsed } : {}),
    },
  });

  return toLessonProgressRecord(row);
}

const HOW_WEBSITES_WORK_ID = "how-websites-work";
const REQUIRED_L1_BLOCK_INDICES = [2, 3, 4];

function assertLessonCompletionPreconditions(
  blocksCompleted: number[],
  quizScore: number | null | undefined,
): void {
  for (const index of REQUIRED_L1_BLOCK_INDICES) {
    if (!blocksCompleted.includes(index)) {
      throw new LessonCompletePreconditionError(
        "Complete all required activities before finishing the lesson",
      );
    }
  }

  if (quizScore !== 1) {
    throw new LessonCompletePreconditionError(
      "Answer the quiz correctly before completing the lesson",
    );
  }
}

export async function completeLessonForUser(
  userId: string,
  lessonId: string,
  input: {
    blocksCompleted: number[];
    quizScore: number | null;
  },
): Promise<CompleteLessonResponse> {
  await getLessonPlayerPayload(lessonId);

  if (lessonId === HOW_WEBSITES_WORK_ID) {
    assertLessonCompletionPreconditions(input.blocksCompleted, input.quizScore);
  }

  return db.$transaction(async (tx) => {
    await assertLessonStepOpenable(userId, lessonId, tx);

    const progressRow = await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: LessonProgressStatus.completed,
        blocksCompleted: input.blocksCompleted,
        quizScore: input.quizScore,
        completedAt: new Date(),
      },
      update: {
        status: LessonProgressStatus.completed,
        blocksCompleted: input.blocksCompleted,
        quizScore: input.quizScore,
        completedAt: new Date(),
      },
    });

    const { completedStep, nextUnlocked } =
      await completeLessonPathStepInTransaction(userId, lessonId, tx);

    return {
      lessonProgress: toLessonProgressRecord(progressRow),
      pathStepCompleted: {
        stepId: completedStep.id,
        referenceId: completedStep.referenceId,
        orderIndex: completedStep.orderIndex,
      },
      nextStepUnlocked: nextUnlocked
        ? {
            stepId: nextUnlocked.id,
            referenceId: nextUnlocked.referenceId,
            orderIndex: nextUnlocked.orderIndex,
          }
        : null,
    };
  });
}

export {
  LessonNotFoundError,
  PathStepLockedError,
  PathStepNotFoundError,
};
