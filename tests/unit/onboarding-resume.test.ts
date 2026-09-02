import { describe, expect, it } from "vitest";

import { AUTHENTICATED_HOME } from "@/lib/auth-routes";
import { ONBOARDING_STEP_ROUTES } from "@/lib/onboarding/onboarding-step";
import {
  createDefaultOnboardingResumeInput,
  getOnboardingRouteGuardRedirect,
  resolveAuthenticatedDestination,
  resolveOnboardingResumeRoute,
  type OnboardingResumeInput,
} from "@/lib/onboarding/onboarding-resume";

function input(
  overrides: Partial<OnboardingResumeInput> = {},
): OnboardingResumeInput {
  return {
    onboardingComplete: false,
    onboardingStep: null,
    learningGoalText: null,
    experienceLevel: null,
    ...overrides,
  };
}

describe("resolveOnboardingResumeRoute", () => {
  it("routes complete users to /dashboard", () => {
    expect(
      resolveOnboardingResumeRoute(
        input({ onboardingComplete: true, onboardingStep: "path" }),
      ),
    ).toBe("/dashboard");
  });

  it("routes stored goal step to /onboarding/goal", () => {
    expect(
      resolveOnboardingResumeRoute(input({ onboardingStep: "goal" })),
    ).toBe("/onboarding/goal");
  });

  it("routes stored experience step to /onboarding/experience", () => {
    expect(
      resolveOnboardingResumeRoute(input({ onboardingStep: "experience" })),
    ).toBe("/onboarding/experience");
  });

  it("routes stored quiz step to /onboarding/quiz", () => {
    expect(
      resolveOnboardingResumeRoute(input({ onboardingStep: "quiz" })),
    ).toBe("/onboarding/quiz");
  });

  it("routes stored path step to /onboarding/path", () => {
    expect(
      resolveOnboardingResumeRoute(input({ onboardingStep: "path" })),
    ).toBe("/onboarding/path");
  });

  it("infers goal when step is null and no goal text", () => {
    expect(resolveOnboardingResumeRoute(input())).toBe("/onboarding/goal");
  });

  it("infers experience when goal exists but experience is missing", () => {
    expect(
      resolveOnboardingResumeRoute(
        input({ learningGoalText: "A portfolio site for my work" }),
      ),
    ).toBe("/onboarding/experience");
  });

  it("infers quiz when goal and experience exist", () => {
    expect(
      resolveOnboardingResumeRoute(
        input({
          learningGoalText: "A portfolio site for my work",
          experienceLevel: "beginner",
        }),
      ),
    ).toBe("/onboarding/quiz");
  });

  it("never infers /onboarding/path without an explicit stored path step", () => {
    expect(
      resolveOnboardingResumeRoute(
        input({
          learningGoalText: "A portfolio site for my work",
          experienceLevel: "intermediate",
        }),
      ),
    ).not.toBe("/onboarding/path");

    expect(
      resolveOnboardingResumeRoute(
        input({
          onboardingStep: "quiz",
          learningGoalText: "A portfolio site for my work",
          experienceLevel: "intermediate",
        }),
      ),
    ).toBe("/onboarding/quiz");
  });

  it("treats blank goal text as missing for inference", () => {
    expect(
      resolveOnboardingResumeRoute(input({ learningGoalText: "   " })),
    ).toBe("/onboarding/goal");
  });
});

describe("resolveAuthenticatedDestination", () => {
  it("returns /dashboard for complete users", () => {
    expect(
      resolveAuthenticatedDestination(input({ onboardingComplete: true })),
    ).toBe(AUTHENTICATED_HOME);
  });

  it("returns resume route for incomplete users", () => {
    expect(
      resolveAuthenticatedDestination(input({ onboardingStep: "experience" })),
    ).toBe(ONBOARDING_STEP_ROUTES.experience);
  });
});

describe("getOnboardingRouteGuardRedirect", () => {
  it("redirects completed users away from onboarding routes", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/onboarding/goal",
        input({ onboardingComplete: true }),
      ),
    ).toBe("/dashboard");
  });

  it("allows completed users on app routes", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/dashboard",
        input({ onboardingComplete: true }),
      ),
    ).toBeNull();
  });

  it("redirects incomplete users from app routes to resume route", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/learn",
        input({ onboardingStep: "quiz" }),
      ),
    ).toBe("/onboarding/quiz");
  });

  it("redirects incomplete users from wrong onboarding routes", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/onboarding/path",
        input({ onboardingStep: "goal" }),
      ),
    ).toBe("/onboarding/goal");
  });

  it("does not redirect when already on the resume route", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/onboarding/experience",
        input({ onboardingStep: "experience" }),
      ),
    ).toBeNull();
  });

  it("does not redirect incomplete users from app route when it matches resume route", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/dashboard",
        input({ onboardingStep: "goal" }),
      ),
    ).toBe("/onboarding/goal");
  });
});

describe("createDefaultOnboardingResumeInput", () => {
  it("defaults missing profile state to goal inference", () => {
    expect(resolveOnboardingResumeRoute(createDefaultOnboardingResumeInput())).toBe(
      "/onboarding/goal",
    );
  });

  it("represents missing or soft-deleted profile routing state", () => {
    expect(
      getOnboardingRouteGuardRedirect(
        "/dashboard",
        createDefaultOnboardingResumeInput(),
      ),
    ).toBe("/onboarding/goal");
  });
});

describe("redirect loop prevention", () => {
  it("allows incomplete users to remain on their resume route", () => {
    const resumeInput = input({ onboardingStep: "quiz" });

    expect(
      getOnboardingRouteGuardRedirect("/onboarding/quiz", resumeInput),
    ).toBeNull();
    expect(resolveOnboardingResumeRoute(resumeInput)).toBe("/onboarding/quiz");
  });
});
