import { describe, expect, it } from "vitest";

import { buildFallbackMentorMessage } from "@/ai/mentor/fallback-copy";
import { L1_LESSON_PAYLOAD } from "../../fixtures/l1-lesson-payload";

describe("buildFallbackMentorMessage", () => {
  it("returns deterministic static prefix", () => {
    const block = L1_LESSON_PAYLOAD.blocks[3]!;
    const message = buildFallbackMentorMessage({
      block,
      helpLevel: 1,
      graderMessage: null,
    });
    expect(message).toContain("Static mentor help");
    expect(message).toContain("comment");
  });

  it("includes grader message at level 2", () => {
    const block = L1_LESSON_PAYLOAD.blocks[3]!;
    const message = buildFallbackMentorMessage({
      block,
      helpLevel: 2,
      graderMessage: "Add comments above html, head, and body.",
    });
    expect(message).toContain("Add comments");
  });
});
