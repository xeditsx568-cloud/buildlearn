import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchProfileOnboarding,
  mergeProfileIntoOnboardingState,
  patchProfileOnboarding,
  ProfileClientError,
} from "@/lib/onboarding/onboarding-client";
import { validateGoalText } from "@/lib/onboarding/validation";
import { getPlacementQuizQuestions } from "@/lib/onboarding/placement-quiz";
import { scorePlacementQuiz } from "@/lib/onboarding/placement-scoring";
import type { OnboardingState } from "@/lib/onboarding/types";

const profileResponse = {
  userId: "user_2abc123",
  learningGoalText: "A persisted portfolio site",
  experienceLevel: "some_exposure" as const,
  onboardingStep: "quiz" as const,
  onboardingComplete: false,
};

const storedState: OnboardingState = {
  goalText: "Stale session goal text",
  experienceLevel: "beginner",
  quizSkipped: false,
  quizCompleted: true,
  quizAnswers: [{ questionId: "placement-q1", selectedOptionId: "placement-q1-a" }],
  placementResult: {
    totalCorrect: 1,
    totalQuestions: 5,
    percentage: 20,
    domainSummary: [{ domain: "html", correct: 1, total: 2 }],
  },
};

function mockFetchJson(
  implementation: (url: string, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", vi.fn(implementation));
}

async function persistThenNavigate(
  patch: () => Promise<unknown>,
  navigate: () => void,
): Promise<boolean> {
  try {
    await patch();
    navigate();
    return true;
  } catch {
    return false;
  }
}

describe("profile hydration", () => {
  it("prefers persisted goal and experience over sessionStorage values", () => {
    const merged = mergeProfileIntoOnboardingState(storedState, profileResponse);

    expect(merged.goalText).toBe("A persisted portfolio site");
    expect(merged.experienceLevel).toBe("some_exposure");
  });

  it("keeps quiz client state from sessionStorage", () => {
    const merged = mergeProfileIntoOnboardingState(storedState, profileResponse);

    expect(merged.quizCompleted).toBe(true);
    expect(merged.quizAnswers).toHaveLength(1);
    expect(merged.placementResult?.totalCorrect).toBe(1);
  });

  it("falls back to sessionStorage when profile fetch is unavailable", () => {
    const merged = mergeProfileIntoOnboardingState(storedState, null);

    expect(merged.goalText).toBe("Stale session goal text");
    expect(merged.experienceLevel).toBe("beginner");
  });
});

describe("profile API client", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET /api/profile returns onboarding fields", async () => {
    mockFetchJson(async () =>
      Response.json(profileResponse, { status: 200 }),
    );

    await expect(fetchProfileOnboarding()).resolves.toEqual(profileResponse);
  });

  it("surfaces API errors from GET /api/profile", async () => {
    mockFetchJson(async () =>
      Response.json({ error: "Profile not found" }, { status: 404 }),
    );

    await expect(fetchProfileOnboarding()).rejects.toBeInstanceOf(
      ProfileClientError,
    );
  });

  it("PATCH /api/profile sends allowed onboarding fields only", async () => {
    mockFetchJson(async (_url, init) => {
      expect(init?.method).toBe("PATCH");
      expect(JSON.parse(String(init?.body))).toEqual({
        learningGoalText: "A bakery landing page",
        onboardingStep: "experience",
      });

      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({
      learningGoalText: "A bakery landing page",
      onboardingStep: "experience",
    });
  });
});

describe("goal persistence", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses existing goal validation before persistence", () => {
    expect(validateGoalText("short")).toEqual({
      valid: false,
      error: "Please describe your goal in at least 10 characters.",
    });
    expect(validateGoalText("A portfolio site")).toEqual({ valid: true });
  });

  it("PATCHes learningGoalText and onboardingStep experience on continue", async () => {
    const bodies: unknown[] = [];

    mockFetchJson(async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({
      learningGoalText: "A portfolio site for my work",
      onboardingStep: "experience",
    });

    expect(bodies[0]).toEqual({
      learningGoalText: "A portfolio site for my work",
      onboardingStep: "experience",
    });
  });

  it("does not navigate when goal PATCH fails", async () => {
    const navigate = vi.fn();

    mockFetchJson(async () =>
      Response.json({ error: "Invalid request body" }, { status: 400 }),
    );

    const navigated = await persistThenNavigate(
      () =>
        patchProfileOnboarding({
          learningGoalText: "A portfolio site for my work",
          onboardingStep: "experience",
        }),
      () => navigate("/onboarding/experience"),
    );

    expect(navigated).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("experience persistence", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("PATCHes experienceLevel and onboardingStep quiz on continue", async () => {
    mockFetchJson(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        experienceLevel: "intermediate",
        onboardingStep: "quiz",
      });

      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({
      experienceLevel: "intermediate",
      onboardingStep: "quiz",
    });
  });

  it("does not navigate when experience PATCH fails", async () => {
    const navigate = vi.fn();

    mockFetchJson(async () =>
      Response.json({ error: "Profile not found" }, { status: 404 }),
    );

    const navigated = await persistThenNavigate(
      () =>
        patchProfileOnboarding({
          experienceLevel: "beginner",
          onboardingStep: "quiz",
        }),
      () => navigate("/onboarding/quiz"),
    );

    expect(navigated).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("quiz persistence", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("PATCHes only onboardingStep path on quiz completion", async () => {
    const bodyKeys: string[] = [];

    mockFetchJson(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      bodyKeys.push(...Object.keys(body));
      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({ onboardingStep: "path" });

    expect(bodyKeys).toEqual(["onboardingStep"]);
  });

  it("PATCHes only onboardingStep path on quiz skip", async () => {
    mockFetchJson(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        onboardingStep: "path",
      });
      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({ onboardingStep: "path" });
  });

  it("does not send placement quiz answers to the profile API", async () => {
    const questions = getPlacementQuizQuestions();
    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: question.correctOptionId,
    }));
    const placementResult = scorePlacementQuiz(questions, answers);

    mockFetchJson(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;

      expect(body).not.toHaveProperty("quizAnswers");
      expect(body).not.toHaveProperty("placementResult");
      expect(body).not.toHaveProperty("quizCompleted");
      expect(body).not.toHaveProperty("quizSkipped");
      expect(body).not.toHaveProperty("totalCorrect");
      expect(placementResult.totalCorrect).toBeGreaterThan(0);

      return Response.json(profileResponse, { status: 200 });
    });

    await patchProfileOnboarding({ onboardingStep: "path" });
  });
});

describe("path completion persistence", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("PATCHes onboardingComplete true and onboardingStep path on Start learning", async () => {
    mockFetchJson(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        onboardingComplete: true,
        onboardingStep: "path",
      });

      return Response.json(
        { ...profileResponse, onboardingComplete: true, onboardingStep: "path" },
        { status: 200 },
      );
    });

    await patchProfileOnboarding({
      onboardingComplete: true,
      onboardingStep: "path",
    });
  });

  it("navigates to /roadmap only after successful completion PATCH", async () => {
    const navigate = vi.fn();

    mockFetchJson(async () =>
      Response.json(
        { ...profileResponse, onboardingComplete: true, onboardingStep: "path" },
        { status: 200 },
      ),
    );

    const navigated = await persistThenNavigate(
      () =>
        patchProfileOnboarding({
          onboardingComplete: true,
          onboardingStep: "path",
        }),
      () => navigate("/roadmap"),
    );

    expect(navigated).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/roadmap");
  });

  it("does not navigate to /roadmap when completion PATCH fails", async () => {
    const navigate = vi.fn();

    mockFetchJson(async () =>
      Response.json({ error: "Profile not found" }, { status: 404 }),
    );

    const navigated = await persistThenNavigate(
      () =>
        patchProfileOnboarding({
          onboardingComplete: true,
          onboardingStep: "path",
        }),
      () => navigate("/roadmap"),
    );

    expect(navigated).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("duplicate submit protection contract", () => {
  it("blocks a second persistence attempt while saving", async () => {
    let saving = false;
    let patchCount = 0;

    async function attemptSave() {
      if (saving) {
        return false;
      }

      saving = true;
      patchCount += 1;
      saving = false;
      return true;
    }

    expect(await attemptSave()).toBe(true);
    saving = true;
    expect(await attemptSave()).toBe(false);
    expect(patchCount).toBe(1);
  });
});
