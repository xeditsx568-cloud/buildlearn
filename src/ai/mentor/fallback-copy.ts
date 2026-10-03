import type { HelpLevel } from "@/lib/ai/mentor-contracts";
import type { LessonBlock } from "@/lib/schemas/lesson";

export type FallbackHelpInput = {
  block: LessonBlock;
  helpLevel: HelpLevel;
  graderMessage: string | null;
};

function blockHint(block: LessonBlock): string | null {
  if (block.type === "interact") {
    return block.hint ?? null;
  }
  if (block.type === "exercise") {
    return block.solutionHint ?? null;
  }
  if (block.type === "quiz") {
    return block.explanation ?? null;
  }
  return null;
}

/**
 * Deterministic teaching copy when AI or Redis is unavailable (§14).
 * Not presented as AI-generated — callers should set response source header.
 */
export function buildFallbackMentorMessage(input: FallbackHelpInput): string {
  const { block, helpLevel, graderMessage } = input;
  const staticHint = blockHint(block);

  const intro =
    "[Static mentor help — live AI is temporarily unavailable.]\n\n";

  if (block.type === "explain" || block.type === "objective" || block.type === "bridge") {
    return (
      intro +
      "Read the lesson section carefully and try the activity on this page when you're ready."
    );
  }

  const instructions =
    "instructions" in block ? block.instructions : block.question;

  if (helpLevel === 1) {
    return (
      intro +
      `Here's what this activity is asking:\n\n${instructions}\n\n` +
      (staticHint ? `Tip: ${staticHint}\n\n` : "") +
      "Take your time — change one small part, then run Check again."
    );
  }

  if (helpLevel === 2) {
    return (
      intro +
      `Focus on the instructions:\n${instructions}\n\n` +
      (graderMessage
        ? `Your last check said: ${graderMessage}\n\n`
        : "") +
      (staticHint ? `Hint: ${staticHint}` : "Look for the lines mentioned in the instructions.")
    );
  }

  return (
    intro +
    `Guidance for this step:\n${instructions}\n\n` +
    (graderMessage ? `Last check: ${graderMessage}\n\n` : "") +
    (staticHint ?? "Use the hint on this block and compare your code to the starter template.")
  );
}
