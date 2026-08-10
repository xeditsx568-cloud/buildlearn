import {
  GOAL_MAX_LENGTH,
  GOAL_MIN_LENGTH,
} from "@/lib/onboarding/constants";

export interface GoalValidationResult {
  valid: boolean;
  error?: string;
}

export function validateGoalText(text: string): GoalValidationResult {
  const trimmed = text.trim();

  if (trimmed.length < GOAL_MIN_LENGTH) {
    return {
      valid: false,
      error: "Please describe your goal in at least 10 characters.",
    };
  }

  if (text.length > GOAL_MAX_LENGTH) {
    return {
      valid: false,
      error: `Goal must be ${GOAL_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true };
}

export function isExperienceSelected(
  experienceLevel: string | null | undefined,
): boolean {
  return (
    experienceLevel === "beginner" ||
    experienceLevel === "some_exposure" ||
    experienceLevel === "intermediate"
  );
}
