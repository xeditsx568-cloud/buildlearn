import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockAssertAccess = vi.fn();
const mockRunHelp = vi.fn();
const mockDbProfile = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/mentor-access-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/services/mentor-access-service")>();
  return {
    ...actual,
    assertMentorLessonAccess: (...args: unknown[]) => mockAssertAccess(...args),
  };
});

vi.mock("@/ai/mentor/orchestrator", () => ({
  runMentorHelp: (...args: unknown[]) => mockRunHelp(...args),
}));

vi.mock("@/server/db", () => ({
  db: {
    profile: {
      findUnique: (...args: unknown[]) => mockDbProfile(...args),
    },
  },
}));

import { POST } from "@/app/api/ai/mentor/help/route";
import { L1_LESSON_PAYLOAD } from "../fixtures/l1-lesson-payload";

describe("POST /api/ai/mentor/help", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbProfile.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await POST(
      new Request("http://test/api/ai/mentor/help", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          action: "get_help",
        }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when lesson access denied", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const { PathStepLockedError } = await import(
      "@/server/services/mentor-access-service"
    );
    mockAssertAccess.mockRejectedValue(new PathStepLockedError());

    const response = await POST(
      new Request("http://test/api/ai/mentor/help", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          action: "get_help",
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns help with server-determined level header", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockAssertAccess.mockResolvedValue(L1_LESSON_PAYLOAD);
    mockRunHelp.mockResolvedValue({
      helpLevel: 2,
      message: "Try near the html tag",
      quota: { remainingThisMonth: 29, resetAt: "2026-11-01T00:00:00.000Z" },
      suggestedActions: ["try_again", "need_more_help"],
      responseSource: "ai",
    });

    const response = await POST(
      new Request("http://test/api/ai/mentor/help", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          action: "get_help",
          learnerCode: "<html></html>",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.helpLevel).toBe(2);
    expect(response.headers.get("X-Mentor-Response-Source")).toBe("ai");
    expect(mockRunHelp).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1" }),
    );
  });

  it("rejects client help level fields", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const response = await POST(
      new Request("http://test/api/ai/mentor/help", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          action: "get_help",
          lastHelpLevelDelivered: 4,
        }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
