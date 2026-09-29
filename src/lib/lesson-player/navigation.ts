import type { LessonBlock } from "@/lib/schemas/lesson";
import { isGradedBlock } from "@/lib/lesson-player/contracts";

export function getGradedBlockIndices(blocks: LessonBlock[]): number[] {
  return blocks
    .map((block, index) => (isGradedBlock(block) ? index : -1))
    .filter((index) => index >= 0);
}

/** Resume at the first graded block not yet in blocksCompleted, else bridge (last block). */
export function getInitialBlockIndex(
  blocks: LessonBlock[],
  blocksCompleted: number[],
): number {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block && isGradedBlock(block) && !blocksCompleted.includes(index)) {
      return index;
    }
  }

  return Math.max(0, blocks.length - 1);
}

export function isBlockPassed(
  blockIndex: number,
  blocksCompleted: number[],
): boolean {
  return blocksCompleted.includes(blockIndex);
}

export function allRequiredGradedBlocksPassed(
  blocks: LessonBlock[],
  blocksCompleted: number[],
): boolean {
  return getGradedBlockIndices(blocks).every((index) =>
    blocksCompleted.includes(index),
  );
}

export function canAdvanceFromBlock(
  blockIndex: number,
  blocks: LessonBlock[],
  blocksCompleted: number[],
  quizScore: number | null,
): boolean {
  const block = blocks[blockIndex];
  if (!block) {
    return false;
  }

  if (isGradedBlock(block)) {
    if (block.type === "quiz") {
      return blocksCompleted.includes(blockIndex) && quizScore === 1;
    }
    return blocksCompleted.includes(blockIndex);
  }

  return true;
}

export function canCompleteLesson(
  blocks: LessonBlock[],
  blocksCompleted: number[],
  quizScore: number | null,
): boolean {
  return (
    allRequiredGradedBlocksPassed(blocks, blocksCompleted) && quizScore === 1
  );
}
