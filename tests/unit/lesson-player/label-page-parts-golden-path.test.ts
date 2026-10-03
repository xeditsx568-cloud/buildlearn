import { describe, expect, it, vi } from "vitest";

import { gradeExerciseBlock } from "@/lib/grading/html-lesson-graders";
import { postMentorHelp } from "@/lib/lesson-player/mentor-client";
import { shouldShowStuckHelpPrompt } from "@/lib/lesson-player/stuck-detection";
import { L1_LESSON_PAYLOAD } from "../../fixtures/l1-lesson-payload";

vi.mock("@/lib/lesson-player/mentor-client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/lesson-player/mentor-client")>();
  return {
    ...actual,
    postMentorHelp: vi.fn(),
  };
});

const EXERCISE_INDEX = 3;
const starter =
  L1_LESSON_PAYLOAD.blocks[EXERCISE_INDEX]?.type === "exercise"
    ? L1_LESSON_PAYLOAD.blocks[EXERCISE_INDEX].starterCode
    : "";

describe("Label the page parts — mentor golden path (automated)", () => {
  it("fails check twice, surfaces stuck prompt, then accepts help progression", async () => {
    const block = L1_LESSON_PAYLOAD.blocks[EXERCISE_INDEX]!;
    expect(block.type).toBe("exercise");

    const failingCode = "<html><head></head><body></body></html>";
    const fail1 = gradeExerciseBlock(failingCode);
    const fail2 = gradeExerciseBlock(failingCode);
    expect(fail1.passed).toBe(false);
    expect(fail2.passed).toBe(false);

    expect(
      shouldShowStuckHelpPrompt({
        localFailCount: 2,
        serverFailCount: 0,
        secondsOnBlock: 30,
        helpTurnsOnBlock: 0,
      }),
    ).toBe(true);

    vi.mocked(postMentorHelp)
      .mockResolvedValueOnce({
        source: "ai",
        data: {
          helpLevel: 1,
          message:
            "Add short notes in your code using <!-- like this -->. Each note labels a major section.",
          quota: { remainingThisMonth: 29, resetAt: "2026-11-01T00:00:00.000Z" },
          suggestedActions: ["try_again", "need_more_help"],
        },
      })
      .mockResolvedValueOnce({
        source: "ai",
        data: {
          helpLevel: 2,
          message:
            "Place a comment on the line above <html>, another above <head>, and one above <body>.",
          editorFocus: { startLine: 2, endLine: 2, label: "Near the html tag" },
          quota: { remainingThisMonth: 28, resetAt: "2026-11-01T00:00:00.000Z" },
          suggestedActions: ["try_again", "need_more_help", "explain_last_check"],
        },
      });

    const help1 = await postMentorHelp({
      lessonId: "how-websites-work",
      blockIndex: EXERCISE_INDEX,
      action: "get_help",
      learnerCode: failingCode,
    });
    expect(help1.data.helpLevel).toBe(1);
    expect(help1.data.message.length).toBeGreaterThan(20);

    const help2 = await postMentorHelp({
      lessonId: "how-websites-work",
      blockIndex: EXERCISE_INDEX,
      action: "need_more_help",
      learnerCode: failingCode,
    });
    expect(help2.data.editorFocus?.label).toContain("html");

    const passCode = `<!-- document -->
<html lang="en">
<!-- head section -->
<head>
<meta charset="UTF-8" />
<title>How Websites Work</title>
</head>
<!-- body section -->
<body>
<h1>How Websites Work</h1>
</body>
</html>`;
    expect(gradeExerciseBlock(passCode).passed).toBe(true);
    expect(starter.length).toBeGreaterThan(0);
  });
});
