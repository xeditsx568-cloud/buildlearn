import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetLessonWithAccess = vi.fn();
const mockCompleteLesson = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/lesson-progress-service", () => ({
  getLessonWithAccessForUser: (...args: unknown[]) =>
    mockGetLessonWithAccess(...args),
  completeLessonForUser: (...args: unknown[]) => mockCompleteLesson(...args),
  LessonNotFoundError: class LessonNotFoundError extends Error {
    constructor(message = "Lesson not found") {
      super(message);
      this.name = "LessonNotFoundError";
    }
  },
  PathStepLockedError: class PathStepLockedError extends Error {
    constructor(message = "Locked") {
      super(message);
      this.name = "PathStepLockedError";
    }
  },
  PathStepNotFoundError: class PathStepNotFoundError extends Error {},
  LessonCompletePreconditionError: class LessonCompletePreconditionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "LessonCompletePreconditionError";
    }
  },
  LessonProgressValidationError: class LessonProgressValidationError extends Error {},
}));

import { GET } from "@/app/api/lessons/[lessonId]/route";
import { POST } from "@/app/api/lessons/[lessonId]/complete/route";
import { PathStepLockedError } from "@/server/services/lesson-progress-service";

describe("GET /api/lessons/[lessonId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await GET(new Request("http://test"), {
      params: Promise.resolve({ lessonId: "how-websites-work" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns lesson payload for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetLessonWithAccess.mockResolvedValue({ lesson: { id: "how-websites-work" } });

    const response = await GET(new Request("http://test"), {
      params: Promise.resolve({ lessonId: "how-websites-work" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetLessonWithAccess).toHaveBeenCalledWith(
      "user_1",
      "how-websites-work",
    );
  });

  it("returns 403 when lesson step is locked", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetLessonWithAccess.mockRejectedValue(new PathStepLockedError());

    const response = await GET(new Request("http://test"), {
      params: Promise.resolve({ lessonId: "how-websites-work" }),
    });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/lessons/[lessonId]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await POST(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ blocksCompleted: [2, 3, 4], quizScore: 1 }),
      }),
      { params: Promise.resolve({ lessonId: "how-websites-work" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns completion summary", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCompleteLesson.mockResolvedValue({
      pathStepCompleted: { referenceId: "how-websites-work" },
    });

    const response = await POST(
      new Request("http://test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocksCompleted: [2, 3, 4], quizScore: 1 }),
      }),
      { params: Promise.resolve({ lessonId: "how-websites-work" }) },
    );

    expect(response.status).toBe(200);
    expect(mockCompleteLesson).toHaveBeenCalledWith(
      "user_1",
      "how-websites-work",
      { blocksCompleted: [2, 3, 4], quizScore: 1 },
    );
  });
});
