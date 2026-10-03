import { describe, expect, it } from "vitest";

import {
  getMentorLimitConfig,
  mentorRequiresRedisBackend,
} from "@/lib/ai/mentor-config";

describe("getMentorLimitConfig", () => {
  it("uses PRD/architecture defaults when unset", () => {
    const config = getMentorLimitConfig({});
    expect(config.monthlyMessageLimit).toBe(30);
    expect(config.requestsPerMinuteLimit).toBe(10);
  });

  it("reads overrides from env in non-production", () => {
    const config = getMentorLimitConfig({
      NODE_ENV: "test",
      AI_MENTOR_MONTHLY_LIMIT: "40",
      AI_MENTOR_RPM_LIMIT: "5",
      MENTOR_REQUIRE_REDIS: "false",
    });
    expect(config.monthlyMessageLimit).toBe(40);
    expect(config.requestsPerMinuteLimit).toBe(5);
    expect(config.requireRedisInProduction).toBe(false);
  });

  it("requires Redis in production even when MENTOR_REQUIRE_REDIS=false", () => {
    expect(
      mentorRequiresRedisBackend({
        NODE_ENV: "production",
        MENTOR_REQUIRE_REDIS: "false",
      }),
    ).toBe(true);
    expect(
      getMentorLimitConfig({
        NODE_ENV: "production",
        MENTOR_REQUIRE_REDIS: "false",
      }).requireRedisInProduction,
    ).toBe(true);
  });
});
