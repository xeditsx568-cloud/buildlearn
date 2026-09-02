import type { ExperienceLevel, OnboardingStep } from "@prisma/client";

import {
  AUTHENTICATED_HOME,
  isOnboardingRoute,
  isProtectedAppRoute,
} from "@/lib/auth-routes";
import { ONBOARDING_STEP_ROUTES } from "@/lib/onboarding/onboarding-step";

/** Profile fields used for ADR-021 onboarding resume routing. */
export type OnboardingResumeInput = {
  onboardingComplete: boolean;
  onboardingStep: OnboardingStep | null;
  learningGoalText: string | null;
  experienceLevel: ExperienceLevel | null;
};

export const DEFAULT_INCOMPLETE_RESUME_ROUTE = ONBOARDING_STEP_ROUTES.goal;

function hasLearningGoal(learningGoalText: string | null): boolean {
  return learningGoalText != null && learningGoalText.trim().length > 0;
}

/** Resolve the onboarding resume route for an incomplete user. */
export function resolveOnboardingResumeRoute(
  input: OnboardingResumeInput,
): string {
  if (input.onboardingComplete) {
    return AUTHENTICATED_HOME;
  }

  if (input.onboardingStep != null) {
    return ONBOARDING_STEP_ROUTES[input.onboardingStep];
  }

  if (!hasLearningGoal(input.learningGoalText)) {
    return ONBOARDING_STEP_ROUTES.goal;
  }

  if (input.experienceLevel == null) {
    return ONBOARDING_STEP_ROUTES.experience;
  }

  return ONBOARDING_STEP_ROUTES.quiz;
}

/** Authenticated home for complete users; resume route otherwise. */
export function resolveAuthenticatedDestination(
  input: OnboardingResumeInput,
): string {
  if (input.onboardingComplete) {
    return AUTHENTICATED_HOME;
  }

  return resolveOnboardingResumeRoute(input);
}

/**
 * Returns a redirect target when route gating applies, otherwise null.
 * Avoids redirect loops by allowing the resolved resume route itself.
 */
export function getOnboardingRouteGuardRedirect(
  pathname: string,
  input: OnboardingResumeInput,
): string | null {
  if (input.onboardingComplete) {
    if (isOnboardingRoute(pathname)) {
      return AUTHENTICATED_HOME;
    }

    return null;
  }

  const resumeRoute = resolveOnboardingResumeRoute(input);

  if (isProtectedAppRoute(pathname) && pathname !== resumeRoute) {
    return resumeRoute;
  }

  if (isOnboardingRoute(pathname) && pathname !== resumeRoute) {
    return resumeRoute;
  }

  return null;
}

/** Default resume input when profile is missing or inactive. */
export function createDefaultOnboardingResumeInput(): OnboardingResumeInput {
  return {
    onboardingComplete: false,
    onboardingStep: null,
    learningGoalText: null,
    experienceLevel: null,
  };
}
