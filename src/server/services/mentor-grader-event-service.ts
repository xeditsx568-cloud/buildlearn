import type { GraderResult } from "@/lib/lesson-player/contracts";
import type { MentorGraderEventRequest } from "@/lib/ai/mentor-contracts";
import {
  assertGraderPayloadForBlock,
  assertMentorLessonAccess,
  getLessonBlockAtIndex,
} from "@/server/services/mentor-access-service";
import { createMentorBlockStateStore } from "@/server/services/mentor-block-state-service";
import type {
  MentorBlockScope,
  MentorBlockStateStore,
} from "@/server/services/mentor-block-state-store";
import { gradeLessonBlockForMentor } from "@/server/services/mentor-grader-service";

export type MentorGraderEventResult = GraderResult & {
  blockState: {
    failedChecksSinceLastPass: number;
    lastLevelDelivered: number;
    helpTurnCount: number;
  };
};

export async function processMentorGraderEvent(input: {
  userId: string;
  body: MentorGraderEventRequest;
  stateStore?: MentorBlockStateStore;
}): Promise<MentorGraderEventResult> {
  const lesson = await assertMentorLessonAccess(
    input.userId,
    input.body.lessonId,
  );
  const block = getLessonBlockAtIndex(lesson, input.body.blockIndex);
  assertGraderPayloadForBlock(block, input.body);

  const graderResult = gradeLessonBlockForMentor({
    block,
    learnerCode: input.body.learnerCode,
    selectedOptionId: input.body.selectedOptionId,
  });

  const stateStore = input.stateStore ?? createMentorBlockStateStore();
  const scope: MentorBlockScope = {
    userId: input.userId,
    lessonId: input.body.lessonId,
    blockIndex: input.body.blockIndex,
  };

  const nextState = await stateStore.applyGraderResult(
    scope,
    graderResult.passed,
    graderResult.message,
  );

  return {
    passed: graderResult.passed,
    message: graderResult.message,
    blockState: {
      failedChecksSinceLastPass: nextState.failedChecksSinceLastPass,
      lastLevelDelivered: nextState.lastLevelDelivered,
      helpTurnCount: nextState.helpTurnCount,
    },
  };
}
