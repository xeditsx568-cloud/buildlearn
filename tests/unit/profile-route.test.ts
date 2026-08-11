import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetOwnProfileOnboarding = vi.fn();
const mockPatchOwnProfileOnboarding = vi.fn();
const mockParsePatchProfileOnboardingInput = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/profile-service", () => ({
  getOwnProfileOnboarding: (...args: unknown[]) =>
    mockGetOwnProfileOnboarding(...args),
  patchOwnProfileOnboarding: (...args: unknown[]) =>
    mockPatchOwnProfileOnboarding(...args),
  parsePatchProfileOnboardingInput: (...args: unknown[]) =>
    mockParsePatchProfileOnboardingInput(...args),
  ProfileNotFoundError: class ProfileNotFoundError extends Error {
    constructor(message = "Profile not found") {
      super(message);
      this.name = "ProfileNotFoundError";
    }
  },
  ProfileValidationError: class ProfileValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ProfileValidationError";
    }
  },
}));

import { GET, PATCH } from "@/app/api/profile/route";
import {
  ProfileNotFoundError,
  ProfileValidationError,
} from "@/server/services/profile-service";

const profilePayload = {
  userId: "user_2abc123",
  learningGoalText: "A portfolio site for my work",
  experienceLevel: "beginner",
  onboardingStep: "experience",
  onboardingComplete: false,
};

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockGetOwnProfileOnboarding).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's profile using Clerk userId", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockGetOwnProfileOnboarding.mockResolvedValue(profilePayload);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profilePayload);
    expect(mockGetOwnProfileOnboarding).toHaveBeenCalledWith("user_2abc123");
  });

  it("returns 404 when profile is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockGetOwnProfileOnboarding.mockRejectedValue(new ProfileNotFoundError());

    const response = await GET();

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PATCH(
      new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ onboardingStep: "quiz" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockPatchOwnProfileOnboarding).not.toHaveBeenCalled();
  });

  it("patches using authenticated Clerk identity without arbitrary userId", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockParsePatchProfileOnboardingInput.mockReturnValue({
      onboardingStep: "path",
      onboardingComplete: true,
    });
    mockPatchOwnProfileOnboarding.mockResolvedValue({
      ...profilePayload,
      onboardingStep: "path",
      onboardingComplete: true,
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          onboardingStep: "path",
          onboardingComplete: true,
          userId: "user_other",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockParsePatchProfileOnboardingInput).toHaveBeenCalledWith({
      onboardingStep: "path",
      onboardingComplete: true,
      userId: "user_other",
    });
    expect(mockPatchOwnProfileOnboarding).toHaveBeenCalledWith(
      "user_2abc123",
      {
        onboardingStep: "path",
        onboardingComplete: true,
      },
    );
  });

  it("returns 400 for validation errors", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockParsePatchProfileOnboardingInput.mockImplementation(() => {
      throw new ProfileValidationError("Invalid request body");
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ experienceLevel: "expert" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockPatchOwnProfileOnboarding).not.toHaveBeenCalled();
  });

  it("returns 404 when profile is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockParsePatchProfileOnboardingInput.mockReturnValue({
      onboardingStep: "goal",
    });
    mockPatchOwnProfileOnboarding.mockRejectedValue(new ProfileNotFoundError());

    const response = await PATCH(
      new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ onboardingStep: "goal" }),
      }),
    );

    expect(response.status).toBe(404);
  });
});
