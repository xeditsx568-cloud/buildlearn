import type { LessonBlock, LessonRecord } from "@/lib/schemas/lesson";

/** Lesson payload for the player (from DB + Zod). */
export type LessonPlayerPayload = Pick<
  LessonRecord,
  "id" | "title" | "estimatedMinutes" | "version" | "conceptIds" | "blocks"
>;

export type LessonProgressStatus = "started" | "completed";

export type LessonProgressRecord = {
  lessonId: string;
  status: LessonProgressStatus;
  blocksCompleted: number[];
  quizScore: number | null;
  hintsUsed: number;
  completedAt: string | null;
};

export type LessonPathAccess = {
  pathStepId: string;
  stepStatus: "locked" | "available" | "in_progress" | "completed" | "skipped";
  canOpen: boolean;
};

export type LessonWithAccessResponse = {
  lesson: LessonPlayerPayload;
  progress: LessonProgressRecord | null;
  pathAccess: LessonPathAccess | null;
};

export type PatchLessonProgressInput = {
  status?: "started";
  blocksCompleted?: number[];
  quizScore?: number | null;
  hintsUsed?: number;
};

export type CompleteLessonResponse = {
  lessonProgress: LessonProgressRecord;
  pathStepCompleted: {
    stepId: string;
    referenceId: string;
    orderIndex: number;
  };
  nextStepUnlocked: {
    stepId: string;
    referenceId: string;
    orderIndex: number;
  } | null;
};

export type GraderResult = {
  passed: boolean;
  message: string;
};

/** Block indices that require grading before advance (L1 convention). */
export const GRADED_BLOCK_TYPES = ["interact", "exercise", "quiz"] as const;

export type GradedBlockType = (typeof GRADED_BLOCK_TYPES)[number];

export function isGradedBlock(
  block: LessonBlock,
): block is Extract<LessonBlock, { type: GradedBlockType }> {
  return (GRADED_BLOCK_TYPES as readonly string[]).includes(block.type);
}
