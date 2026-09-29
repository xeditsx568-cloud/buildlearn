import type { LessonBlock } from "@/lib/schemas/lesson";

export function removeBlockFromCompleted(
  blocksCompleted: number[],
  blockIndex: number,
): number[] {
  return blocksCompleted.filter((index) => index !== blockIndex);
}

/**
 * After a learner edits code or changes a quiz answer, drop completion for that block.
 * Quiz invalidation also clears quizScore so Continue/Complete stay gated.
 */
export function invalidateGradedBlockPass(
  blocksCompleted: number[],
  blockIndex: number,
  block: LessonBlock | undefined,
  quizScore: number | null,
): { blocksCompleted: number[]; quizScore: number | null } {
  if (!blocksCompleted.includes(blockIndex)) {
    return { blocksCompleted, quizScore };
  }

  const nextBlocks = removeBlockFromCompleted(blocksCompleted, blockIndex);
  const nextQuizScore = block?.type === "quiz" ? null : quizScore;

  return { blocksCompleted: nextBlocks, quizScore: nextQuizScore };
}

export function shouldInvalidateQuizOnSelectionChange(
  blocksCompleted: number[],
  blockIndex: number,
  quizScore: number | null,
  previousOption: string | null,
  nextOption: string,
): boolean {
  const wasPassed =
    blocksCompleted.includes(blockIndex) || quizScore === 1;

  if (!wasPassed) {
    return false;
  }

  return previousOption !== nextOption;
}

export function shouldInvalidateEditorOnChange(
  blocksCompleted: number[],
  blockIndex: number,
  block: LessonBlock | undefined,
): boolean {
  if (block?.type !== "interact" && block?.type !== "exercise") {
    return false;
  }

  return blocksCompleted.includes(blockIndex);
}
