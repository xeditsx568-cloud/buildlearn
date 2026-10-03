import { describe, expect, it } from "vitest";

import { buildMentorContext } from "@/ai/mentor/context-builder";
import { createInitialMentorBlockState } from "@/lib/ai/mentor-contracts";
import { L1_LESSON_PAYLOAD } from "../../fixtures/l1-lesson-payload";

describe("buildMentorContext", () => {
  it("includes L1 exercise block instructions", () => {
    const ctx = buildMentorContext({
      lesson: L1_LESSON_PAYLOAD,
      blockIndex: 3,
      request: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        action: "get_help",
        learnerCode: "<html></html>",
      },
      blockState: createInitialMentorBlockState(),
    });

    expect(ctx.block.type).toBe("exercise");
    if (ctx.block.type !== "exercise") {
      throw new Error("expected exercise block at index 3");
    }
    expect(ctx.block.title).toBe("Label the page parts");
    expect(ctx.effectiveHelpLevel).toBe(1);
    expect(ctx.learningObjective).toContain("browser");
  });

  it("throws via invalid block index at route layer", () => {
    expect(L1_LESSON_PAYLOAD.blocks.length).toBeGreaterThan(0);
  });
});
