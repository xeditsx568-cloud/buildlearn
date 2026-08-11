import {
  ExperienceLevel,
  type Profile,
} from "@prisma/client";
import { z } from "zod";

import {
  GOAL_MAX_LENGTH,
  GOAL_MIN_LENGTH,
} from "@/lib/onboarding/constants";
import { ONBOARDING_STEP_VALUES } from "@/lib/onboarding/onboarding-step";
import { db } from "@/server/db";

export class ProfileNotFoundError extends Error {
  constructor(message = "Profile not found") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

const experienceLevelSchema = z.nativeEnum(ExperienceLevel);
const onboardingStepSchema = z.enum(ONBOARDING_STEP_VALUES);

const learningGoalTextSchema = z
  .string()
  .min(
    GOAL_MIN_LENGTH,
    `learningGoalText must be at least ${GOAL_MIN_LENGTH} characters`,
  )
  .max(
    GOAL_MAX_LENGTH,
    `learningGoalText must be ${GOAL_MAX_LENGTH} characters or fewer`,
  );

export const patchProfileOnboardingSchema = z
  .object({
    learningGoalText: learningGoalTextSchema.optional(),
    experienceLevel: experienceLevelSchema.optional(),
    onboardingStep: onboardingStepSchema.optional(),
    onboardingComplete: z.boolean().optional(),
  })
  .strict();

export type PatchProfileOnboardingInput = z.infer<
  typeof patchProfileOnboardingSchema
>;

export type ProfileOnboardingRecord = Pick<
  Profile,
  | "userId"
  | "learningGoalText"
  | "experienceLevel"
  | "onboardingStep"
  | "onboardingComplete"
>;

function toProfileOnboardingRecord(
  profile: Profile,
): ProfileOnboardingRecord {
  return {
    userId: profile.userId,
    learningGoalText: profile.learningGoalText,
    experienceLevel: profile.experienceLevel,
    onboardingStep: profile.onboardingStep,
    onboardingComplete: profile.onboardingComplete,
  };
}

export function parsePatchProfileOnboardingInput(
  payload: unknown,
): PatchProfileOnboardingInput {
  const result = patchProfileOnboardingSchema.safeParse(payload);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new ProfileValidationError(message || "Invalid request body");
  }

  if (Object.keys(result.data).length === 0) {
    throw new ProfileValidationError("At least one onboarding field is required");
  }

  return result.data;
}

async function findActiveProfile(userId: string): Promise<Profile | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  return user.profile;
}

/** Read the authenticated user's onboarding profile fields. */
export async function getOwnProfileOnboarding(
  userId: string,
): Promise<ProfileOnboardingRecord> {
  const profile = await findActiveProfile(userId);

  if (!profile) {
    throw new ProfileNotFoundError();
  }

  return toProfileOnboardingRecord(profile);
}

/** Patch approved onboarding fields on the authenticated user's profile. */
export async function patchOwnProfileOnboarding(
  userId: string,
  input: PatchProfileOnboardingInput,
): Promise<ProfileOnboardingRecord> {
  const existing = await findActiveProfile(userId);

  if (!existing) {
    throw new ProfileNotFoundError();
  }

  const updated = await db.profile.update({
    where: { userId },
    data: input,
  });

  return toProfileOnboardingRecord(updated);
}
