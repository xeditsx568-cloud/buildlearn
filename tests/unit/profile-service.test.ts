import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    profile: {
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

import {
  getOwnProfileOnboarding,
  parsePatchProfileOnboardingInput,
  patchOwnProfileOnboarding,
  ProfileNotFoundError,
  ProfileValidationError,
} from "@/server/services/profile-service";

const baseProfile = {
  userId: "user_2abc123",
  displayName: null,
  learningGoalText: "A portfolio site for my work",
  experienceLevel: "beginner" as const,
  goalSummary: null,
  onboardingComplete: false,
  onboardingStep: "experience" as const,
};

describe("parsePatchProfileOnboardingInput", () => {
  it("accepts valid onboarding field updates", () => {
    expect(
      parsePatchProfileOnboardingInput({
        learningGoalText: "A bakery landing page",
        experienceLevel: "some_exposure",
        onboardingStep: "quiz",
        onboardingComplete: true,
      }),
    ).toEqual({
      learningGoalText: "A bakery landing page",
      experienceLevel: "some_exposure",
      onboardingStep: "quiz",
      onboardingComplete: true,
    });
  });

  it("rejects goal text shorter than 10 characters", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({ learningGoalText: "short" }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects goal text longer than 500 characters", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({ learningGoalText: "x".repeat(501) }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects invalid experience enum values", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({ experienceLevel: "expert" }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects invalid onboardingStep values", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({ onboardingStep: "roadmap" }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects non-boolean onboardingComplete values", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({ onboardingComplete: "yes" }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects unsupported fields", () => {
    expect(() =>
      parsePatchProfileOnboardingInput({
        learningGoalText: "A portfolio site",
        userId: "user_other",
      }),
    ).toThrow(ProfileValidationError);
  });

  it("rejects empty patch payloads", () => {
    expect(() => parsePatchProfileOnboardingInput({})).toThrow(
      ProfileValidationError,
    );
  });
});

describe("getOwnProfileOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the authenticated user's profile onboarding fields", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: null,
      profile: baseProfile,
    });

    await expect(getOwnProfileOnboarding("user_2abc123")).resolves.toEqual({
      userId: "user_2abc123",
      learningGoalText: "A portfolio site for my work",
      experienceLevel: "beginner",
      onboardingStep: "experience",
      onboardingComplete: false,
    });
  });

  it("throws when profile row is missing", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: null,
      profile: null,
    });

    await expect(getOwnProfileOnboarding("user_2abc123")).rejects.toBeInstanceOf(
      ProfileNotFoundError,
    );
  });

  it("throws when user is soft-deleted", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
      profile: baseProfile,
    });

    await expect(getOwnProfileOnboarding("user_2abc123")).rejects.toBeInstanceOf(
      ProfileNotFoundError,
    );
  });
});

describe("patchOwnProfileOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: null,
      profile: baseProfile,
    });
  });

  it("patches learningGoalText", async () => {
    mockProfileUpdate.mockResolvedValue({
      ...baseProfile,
      learningGoalText: "A blog about cooking",
    });

    await expect(
      patchOwnProfileOnboarding("user_2abc123", {
        learningGoalText: "A blog about cooking",
      }),
    ).resolves.toMatchObject({
      learningGoalText: "A blog about cooking",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      data: { learningGoalText: "A blog about cooking" },
    });
  });

  it("patches experienceLevel", async () => {
    mockProfileUpdate.mockResolvedValue({
      ...baseProfile,
      experienceLevel: "intermediate",
    });

    await patchOwnProfileOnboarding("user_2abc123", {
      experienceLevel: "intermediate",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      data: { experienceLevel: "intermediate" },
    });
  });

  it("patches onboardingStep", async () => {
    mockProfileUpdate.mockResolvedValue({
      ...baseProfile,
      onboardingStep: "path",
    });

    await patchOwnProfileOnboarding("user_2abc123", {
      onboardingStep: "path",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      data: { onboardingStep: "path" },
    });
  });

  it("patches onboardingComplete", async () => {
    mockProfileUpdate.mockResolvedValue({
      ...baseProfile,
      onboardingComplete: true,
      onboardingStep: "path",
    });

    await patchOwnProfileOnboarding("user_2abc123", {
      onboardingComplete: true,
      onboardingStep: "path",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      data: { onboardingComplete: true, onboardingStep: "path" },
    });
  });

  it("does not alter unprovided fields in the service update payload", async () => {
    mockProfileUpdate.mockResolvedValue({
      ...baseProfile,
      onboardingStep: "quiz",
    });

    await patchOwnProfileOnboarding("user_2abc123", {
      onboardingStep: "quiz",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      data: { onboardingStep: "quiz" },
    });
    expect(mockProfileUpdate.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "learningGoalText",
    );
  });

  it("throws when profile row is missing", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: null,
      profile: null,
    });

    await expect(
      patchOwnProfileOnboarding("user_2abc123", {
        onboardingStep: "goal",
      }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });
});
