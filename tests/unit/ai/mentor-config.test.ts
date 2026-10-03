import { describe, expect, it } from "vitest";

import { getMentorLimitConfig } from "@/lib/ai/mentor-config";

describe("getMentorLimitConfig", () => {
  it("uses PRD/architecture defaults when unset", () => {
    const config = getMentorLimitConfig({});
    expect(config.monthlyMessageLimit).toBe(30);
    expect(config.requestsPerMinuteLimit).toBe(10);
  });

  it("reads overrides from env", () => {
    const config = getMentorLimitConfig({
      AI_MENTOR_MONTHLY_LIMIT: "40",
      AI_MENTOR_RPM_LIMIT: "5",
      MENTOR_REQUIRE_REDIS: "false",
    });
    expect(config.monthlyMessageLimit).toBe(40);
    expect(config.requestsPerMinuteLimit).toBe(5);
    expect(config.requireRedisInProduction).toBe(false);
  });
});
