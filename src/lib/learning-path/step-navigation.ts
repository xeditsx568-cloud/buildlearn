import type { LearningPathStepType } from "@prisma/client";

/** Player URL for an unlocked roadmap step (MVP-M1 navigation). */
export function getStepPlayerHref(
  stepType: LearningPathStepType,
  referenceId: string,
): string | null {
  switch (stepType) {
    case "lesson":
      return `/learn/lessons/${referenceId}`;
    case "challenge":
      return `/learn/challenges/${referenceId}`;
    case "project_milestone":
      return `/project?milestone=${referenceId}`;
    default:
      return null;
  }
}
