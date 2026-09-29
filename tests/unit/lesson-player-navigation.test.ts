import { describe, expect, it } from "vitest";

import {
  allRequiredGradedBlocksPassed,
  canAdvanceFromBlock,
  canCompleteLesson,
  getInitialBlockIndex,
} from "@/lib/lesson-player/navigation";
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

describe("lesson player navigation", () => {
  it("starts at the first incomplete graded block", () => {
    expect(getInitialBlockIndex(blocks, [])).toBe(2);
    expect(getInitialBlockIndex(blocks, [2])).toBe(3);
    expect(getInitialBlockIndex(blocks, [2, 3, 4])).toBe(5);
  });

  it("blocks continue until graded sections pass", () => {
    expect(canAdvanceFromBlock(2, blocks, [], null)).toBe(false);
    expect(canAdvanceFromBlock(2, blocks, [2], null)).toBe(true);
    expect(canAdvanceFromBlock(4, blocks, [2, 3], null)).toBe(false);
    expect(canAdvanceFromBlock(4, blocks, [2, 3, 4], 1)).toBe(true);
  });

  it("requires all graded blocks and quiz score for completion", () => {
    expect(allRequiredGradedBlocksPassed(blocks, [2, 3])).toBe(false);
    expect(canCompleteLesson(blocks, [2, 3, 4], null)).toBe(false);
    expect(canCompleteLesson(blocks, [2, 3, 4], 1)).toBe(true);
  });
});
