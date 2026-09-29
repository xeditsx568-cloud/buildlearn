import { describe, expect, it } from "vitest";

import { canAdvanceFromBlock } from "@/lib/lesson-player/navigation";
import {
  invalidateGradedBlockPass,
  shouldInvalidateEditorOnChange,
  shouldInvalidateQuizOnSelectionChange,
} from "@/lib/lesson-player/pass-state";
import type { LessonBlock } from "@/lib/schemas/lesson";

const blocks = [
  { type: "objective", title: "Goals", objectives: ["a"] },
  { type: "explain", body: "text" },
  {
    type: "interact",
    instructions: "edit",
    language: "html",
    starterCode: "<p>x</p>",
  },
  {
    type: "exercise",
    title: "ex",
    instructions: "do",
    language: "html",
    starterCode: "<p>x</p>",
  },
  {
    type: "quiz",
    question: "q",
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    correctOptionId: "b",
  },
  { type: "bridge", body: "done" },
] as LessonBlock[];

describe("pass-state invalidation", () => {
  it("removes interact block from blocksCompleted after invalidation", () => {
    const interactBlock = blocks[2];
    const result = invalidateGradedBlockPass(
      [2, 3],
      2,
      interactBlock,
      null,
    );

    expect(result.blocksCompleted).toEqual([3]);
    expect(result.quizScore).toBeNull();
  });

  it("gates Continue after interact pass is invalidated (code activity)", () => {
    expect(canAdvanceFromBlock(2, blocks, [2], null)).toBe(true);

    const { blocksCompleted } = invalidateGradedBlockPass(
      [2],
      2,
      blocks[2],
      null,
    );

    expect(canAdvanceFromBlock(2, blocks, blocksCompleted, null)).toBe(false);
  });

  it("clears quiz block and quizScore when quiz pass is invalidated", () => {
    const quizBlock = blocks[4];
    const result = invalidateGradedBlockPass([2, 3, 4], 4, quizBlock, 1);

    expect(result.blocksCompleted).toEqual([2, 3]);
    expect(result.quizScore).toBeNull();
  });

  it("gates Continue after quiz pass is invalidated", () => {
    expect(canAdvanceFromBlock(4, blocks, [2, 3, 4], 1)).toBe(true);

    const { blocksCompleted, quizScore } = invalidateGradedBlockPass(
      [2, 3, 4],
      4,
      blocks[4],
      1,
    );

    expect(canAdvanceFromBlock(4, blocks, blocksCompleted, quizScore)).toBe(
      false,
    );
  });

  it("shouldInvalidateEditorOnChange only when block was passed", () => {
    expect(
      shouldInvalidateEditorOnChange([2], 2, blocks[2]),
    ).toBe(true);
    expect(
      shouldInvalidateEditorOnChange([], 2, blocks[2]),
    ).toBe(false);
  });

  it("shouldInvalidateQuizOnSelectionChange when passed and option changes", () => {
    expect(
      shouldInvalidateQuizOnSelectionChange([4], 4, 1, "b", "a"),
    ).toBe(true);
    expect(
      shouldInvalidateQuizOnSelectionChange([], 4, null, null, "a"),
    ).toBe(false);
    expect(
      shouldInvalidateQuizOnSelectionChange([4], 4, 1, "b", "b"),
    ).toBe(false);
  });
});
