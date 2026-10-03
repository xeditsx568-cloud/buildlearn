import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetStatus = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/server/services/mentor-quota-service", () => ({
  createMentorQuotaService: () => ({
    getStatus: (...args: unknown[]) => mockGetStatus(...args),
  }),
}));

import { GET } from "@/app/api/ai/mentor/quota/route";

describe("GET /api/ai/mentor/quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns learner-safe quota fields", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetStatus.mockResolvedValue({
      remainingThisMonth: 25,
      limitThisMonth: 30,
      resetAt: "2026-11-01T00:00:00.000Z",
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      remainingThisMonth: 25,
      limitThisMonth: 30,
      resetAt: "2026-11-01T00:00:00.000Z",
    });
    expect(response.headers.get("X-Mentor-Quota-Remaining")).toBe("25");
  });
});
