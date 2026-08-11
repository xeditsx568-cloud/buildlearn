import type { OnboardingStep } from "@prisma/client";

/** ADR-021 onboarding resume step values — mirrors Prisma `OnboardingStep` enum. */
export const ONBOARDING_STEP_VALUES = [
  "goal",
  "experience",
  "quiz",
  "path",
] as const satisfies readonly OnboardingStep[];

export type OnboardingStepValue = (typeof ONBOARDING_STEP_VALUES)[number];

export const ONBOARDING_STEP_ROUTES: Record<OnboardingStepValue, string> = {
  goal: "/onboarding/goal",
  experience: "/onboarding/experience",
  quiz: "/onboarding/quiz",
  path: "/onboarding/path",
};

export function isOnboardingStepValue(
  value: unknown,
): value is OnboardingStepValue {
  return (
    typeof value === "string" &&
    ONBOARDING_STEP_VALUES.includes(value as OnboardingStepValue)
  );
}
