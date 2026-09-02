import type { OnboardingStepValue } from "@/lib/onboarding/onboarding-step";
import type { ExperienceLevel, OnboardingState } from "@/lib/onboarding/types";

export type ProfileOnboardingResponse = {
  userId: string;
  learningGoalText: string | null;
  experienceLevel: ExperienceLevel | null;
  onboardingStep: OnboardingStepValue | null;
  onboardingComplete: boolean;
};

export type PatchProfileOnboardingPayload = {
  learningGoalText?: string;
  experienceLevel?: ExperienceLevel;
  onboardingStep?: OnboardingStepValue;
  onboardingComplete?: boolean;
};

export class ProfileClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProfileClientError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Request failed";
  } catch {
    return "Request failed";
  }
}

/** Fetch the authenticated user's onboarding profile fields. */
export async function fetchProfileOnboarding(): Promise<ProfileOnboardingResponse> {
  const response = await fetch("/api/profile", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ProfileClientError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as ProfileOnboardingResponse;
}

/** Patch approved onboarding profile fields for the authenticated user. */
export async function patchProfileOnboarding(
  payload: PatchProfileOnboardingPayload,
): Promise<ProfileOnboardingResponse> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ProfileClientError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as ProfileOnboardingResponse;
}

/** Merge persisted profile fields into client onboarding state without clobbering quiz session data. */
export function mergeProfileIntoOnboardingState(
  stored: OnboardingState,
  profile: ProfileOnboardingResponse | null,
): OnboardingState {
  if (!profile) {
    return stored;
  }

  return {
    ...stored,
    goalText: profile.learningGoalText ?? stored.goalText,
    experienceLevel: profile.experienceLevel ?? stored.experienceLevel,
  };
}
