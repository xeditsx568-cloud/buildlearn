import type { GraderResult } from "@/lib/lesson-player/contracts";
import {
  gradeExerciseBlock,
  gradeInteractBlock,
  gradeQuizSelection,
} from "@/lib/grading/html-lesson-graders";
import type { LessonBlock } from "@/lib/schemas/lesson";

export type GradeLessonBlockInput = {
  block: LessonBlock;
  learnerCode?: string;
  selectedOptionId?: string;
};

/**
 * Server-side grading for mentor grader-event (§5.3.1).
 * Uses the same deterministic rules as the lesson player.
 */
export function gradeLessonBlockForMentor(
  input: GradeLessonBlockInput,
): GraderResult {
  const { block, learnerCode, selectedOptionId } = input;

  switch (block.type) {
    case "interact": {
      if (learnerCode === undefined) {
        return {
          passed: false,
          message: "Submit your HTML code before checking.",
        };
      }
      return gradeInteractBlock(learnerCode, block.starterCode);
    }
    case "exercise": {
      if (learnerCode === undefined) {
        return {
          passed: false,
          message: "Submit your HTML code before checking.",
        };
      }
      return gradeExerciseBlock(learnerCode);
    }
    case "quiz": {
      if (!selectedOptionId) {
        return {
          passed: false,
          message: "Select an answer before checking.",
        };
      }
      return gradeQuizSelection(selectedOptionId, block.correctOptionId);
    }
    default:
      return {
        passed: false,
        message: "This block type does not support grading.",
      };
  }
}
