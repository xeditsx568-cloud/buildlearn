import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMentorQuotaService,
  resetMentorQuotaServiceForTests,
} from "@/server/services/mentor-quota-service";
import { MentorQuotaExceededError } from "@/server/services/mentor-errors";

describe("InMemory mentor quota service", () => {
  afterEach(() => {
    resetMentorQuotaServiceForTests();
    vi.unstubAllEnvs();
  });

  it("tracks monthly remaining after reservation", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const service = createMentorQuotaService();
    const initial = await service.getStatus("user_q");
    expect(initial.remainingThisMonth).toBe(30);

    await service.assertCanRequestHelp("user_q");
    await service.reserveMonthlyAiQuota("user_q");

    const after = await service.getStatus("user_q");
    expect(after.remainingThisMonth).toBe(29);
  });

  it("throws when monthly quota exhausted on reserve", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "1");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const service = createMentorQuotaService();
    await service.reserveMonthlyAiQuota("user_exhaust");

    await expect(service.reserveMonthlyAiQuota("user_exhaust")).rejects.toThrow(
      MentorQuotaExceededError,
    );
  });
});
