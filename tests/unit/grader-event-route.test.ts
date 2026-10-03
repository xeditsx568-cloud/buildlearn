import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockProcess = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/mentor-grader-event-service", () => ({
  processMentorGraderEvent: (...args: unknown[]) => mockProcess(...args),
}));

import { POST } from "@/app/api/ai/mentor/grader-event/route";

describe("POST /api/ai/mentor/grader-event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await POST(
      new Request("http://test/api/ai/mentor/grader-event", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: "<html></html>",
        }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("rejects forged passed field with 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const response = await POST(
      new Request("http://test/api/ai/mentor/grader-event", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: "<html></html>",
          passed: false,
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it("rejects authoritative counter injection", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const response = await POST(
      new Request("http://test/api/ai/mentor/grader-event", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: "<html></html>",
          failedChecksSinceLastPass: 99,
        }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 413 for oversized body", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const huge = "x".repeat(33 * 1024);
    const response = await POST(
      new Request("http://test/api/ai/mentor/grader-event", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: huge,
        }),
      }),
    );
    expect(response.status).toBe(413);
  });

  it("delegates valid requests to grader service", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockProcess.mockResolvedValue({
      passed: false,
      message: "nope",
      blockState: {
        failedChecksSinceLastPass: 1,
        lastLevelDelivered: 0,
        helpTurnCount: 0,
      },
    });

    const response = await POST(
      new Request("http://test/api/ai/mentor/grader-event", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "how-websites-work",
          blockIndex: 3,
          learnerCode: "<html></html>",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockProcess).toHaveBeenCalled();
  });
});
