import { M3_MENTOR_LESSON_ID } from "@/lib/ai/mentor-contracts";
import type { LessonPlayerPayload } from "@/lib/lesson-player/contracts";
import type { LessonBlock } from "@/lib/schemas/lesson";
import {
  assertLessonStepOpenable,
  PathStepLockedError,
} from "@/server/services/learning-path-step-service";
import {
  getLessonPlayerPayload,
  LessonNotFoundError,
} from "@/server/services/lesson-service";
import { MentorBlockIndexError } from "@/server/services/mentor-errors";

export { LessonNotFoundError, PathStepLockedError };

export async function assertMentorLessonAccess(
  userId: string,
  lessonId: string,
): Promise<LessonPlayerPayload> {
  if (lessonId !== M3_MENTOR_LESSON_ID) {
    throw new MentorBlockIndexError("Mentor is only available for Lesson 1");
  }

  const lesson = await getLessonPlayerPayload(lessonId);
  await assertLessonStepOpenable(userId, lessonId);
  return lesson;
}

export function getLessonBlockAtIndex(
  lesson: LessonPlayerPayload,
  blockIndex: number,
): LessonBlock {
  if (
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    blockIndex >= lesson.blocks.length
  ) {
    throw new MentorBlockIndexError();
  }

  return lesson.blocks[blockIndex]!;
}

export function assertGraderPayloadForBlock(
  block: LessonBlock,
  payload: { learnerCode?: string; selectedOptionId?: string },
): void {
  switch (block.type) {
    case "interact":
    case "exercise":
      if (!payload.learnerCode?.trim()) {
        throw new MentorBlockIndexError(
          "learnerCode is required for this block",
        );
      }
      break;
    case "quiz":
      if (!payload.selectedOptionId?.trim()) {
        throw new MentorBlockIndexError(
          "selectedOptionId is required for quiz blocks",
        );
      }
      break;
    default:
      throw new MentorBlockIndexError(
        "This block type does not support grader events",
      );
  }
}
