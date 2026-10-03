import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMentorQuotaService,
  monthQuotaKey,
  resetMentorQuotaServiceForTests,
} from "@/server/services/mentor-quota-service";
import { MentorQuotaExceededError } from "@/server/services/mentor-errors";

describe("atomic monthly quota (in-memory)", () => {
  afterEach(() => {
    resetMentorQuotaServiceForTests();
    vi.unstubAllEnvs();
  });

  it("allows 30 reservations then rejects the 31st", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "30");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const service = createMentorQuotaService();
    for (let i = 0; i < 30; i++) {
      await service.reserveMonthlyAiQuota("user_month");
    }
    await expect(
      service.reserveMonthlyAiQuota("user_month"),
    ).rejects.toThrow(MentorQuotaExceededError);
  });

  it("concurrent reservations cannot exceed limit of 1", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "1");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const service = createMentorQuotaService();
    const results = await Promise.allSettled([
      service.reserveMonthlyAiQuota("user_race"),
      service.reserveMonthlyAiQuota("user_race"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("release restores monthly slot after failed AI path", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "1");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const service = createMentorQuotaService();
    await service.reserveMonthlyAiQuota("user_rel");
    await service.releaseMonthlyAiQuota("user_rel");
    const status = await service.getStatus("user_rel");
    expect(status.remainingThisMonth).toBe(1);
  });

  it("isolates users and month buckets", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "1");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const service = createMentorQuotaService();
    await service.reserveMonthlyAiQuota("user_a");
    await service.reserveMonthlyAiQuota("user_b");

    expect(monthQuotaKey("user_a")).not.toBe(monthQuotaKey("user_b"));
    await expect(service.reserveMonthlyAiQuota("user_a")).rejects.toThrow(
      MentorQuotaExceededError,
    );
    await expect(service.reserveMonthlyAiQuota("user_b")).rejects.toThrow(
      MentorQuotaExceededError,
    );
  });
});
