import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetActiveLearningPathForUser = vi.fn();
const mockEnsureActiveLearningPathForUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/learning-path-service", () => ({
  getActiveLearningPathForUser: (...args: unknown[]) =>
    mockGetActiveLearningPathForUser(...args),
  ensureActiveLearningPathForUser: (...args: unknown[]) =>
    mockEnsureActiveLearningPathForUser(...args),
  LearningPathPreconditionError: class LearningPathPreconditionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "LearningPathPreconditionError";
    }
  },
}));

import { GET, POST } from "@/app/api/learning-path/route";
import { LearningPathPreconditionError } from "@/server/services/learning-path-service";

const pathPayload = {
  id: "path_1",
  goalDisplayTitle: "A portfolio site",
  goalTemplateId: "portfolio-site",
  status: "active",
  generatedBy: "system",
  steps: [
    {
      id: "step_1",
      orderIndex: 0,
      stepType: "lesson",
      referenceId: "how-websites-work",
      status: "available",
      displayTitle: "How Websites Work",
      sectionId: "foundations",
      playerHref: "/learn/lessons/how-websites-work",
    },
  ],
};

describe("GET /api/learning-path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns 404 when no active path exists", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetActiveLearningPathForUser.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns path for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetActiveLearningPathForUser.mockResolvedValue(pathPayload);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(pathPayload);
  });
});

describe("POST /api/learning-path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when prerequisites fail", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockEnsureActiveLearningPathForUser.mockRejectedValue(
      new LearningPathPreconditionError("learningGoalText is required"),
    );

    const response = await POST();
    expect(response.status).toBe(400);
  });

  it("returns generated path", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockEnsureActiveLearningPathForUser.mockResolvedValue(pathPayload);

    const response = await POST();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(pathPayload);
  });
});
