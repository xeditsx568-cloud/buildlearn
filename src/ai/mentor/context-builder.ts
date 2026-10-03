import type {
  HelpLevel,
  MentorBlockState,
  MentorHelpAction,
  MentorHelpRequest,
} from "@/lib/ai/mentor-contracts";
import { resolveEffectiveHelpLevel } from "@/ai/mentor/help-policy";
import type { LessonPlayerPayload } from "@/lib/lesson-player/contracts";
import type { LessonBlock } from "@/lib/schemas/lesson";
import type { ExperienceLevel } from "@prisma/client";

export type MentorContext = {
  lessonTitle: string;
  estimatedMinutes: number;
  block: LessonBlock;
  blockIndex: number;
  learningObjective: string | null;
  experienceLevel: ExperienceLevel | null;
  learningGoalText: string | null;
  effectiveHelpLevel: HelpLevel;
  action: MentorHelpAction;
  blockState: MentorBlockState;
  graderMessage: string | null;
  starterCode: string | null;
  learnerCode: string | null;
  learnerQuestion: string | null;
};

function summarizeObjectives(lesson: LessonPlayerPayload): string | null {
  for (const block of lesson.blocks) {
    if (block.type === "objective" && block.objectives.length > 0) {
      return block.objectives.slice(0, 3).join("; ");
    }
  }
  return null;
}

function starterForBlock(block: LessonBlock): string | null {
  if (block.type === "interact" || block.type === "exercise") {
    return block.starterCode;
  }
  return null;
}

export function buildMentorContext(input: {
  lesson: LessonPlayerPayload;
  blockIndex: number;
  request: MentorHelpRequest;
  blockState: MentorBlockState;
  experienceLevel?: ExperienceLevel | null;
  learningGoalText?: string | null;
}): MentorContext {
  const block = input.lesson.blocks[input.blockIndex]!;
  const { effectiveLevel } = resolveEffectiveHelpLevel(
    input.request.action,
    input.blockState,
  );

  const goal =
    input.learningGoalText && input.learningGoalText.length > 0
      ? input.learningGoalText.slice(0, 120)
      : null;

  return {
    lessonTitle: input.lesson.title,
    estimatedMinutes: input.lesson.estimatedMinutes,
    block,
    blockIndex: input.blockIndex,
    learningObjective: summarizeObjectives(input.lesson),
    experienceLevel: input.experienceLevel ?? null,
    learningGoalText: goal,
    effectiveHelpLevel: effectiveLevel,
    action: input.request.action,
    blockState: input.blockState,
    graderMessage: input.blockState.lastGraderMessage,
    starterCode: starterForBlock(block),
    learnerCode: input.request.learnerCode ?? null,
    learnerQuestion: input.request.learnerQuestion ?? null,
  };
}
