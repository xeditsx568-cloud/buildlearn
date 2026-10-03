/**
 * MVP-M3 mentor limits — configurable defaults (PRD §3 monthly, ARCHITECTURE §3.6 RPM).
 * FR-9.6 requires quotas but does not define these numeric literals.
 */

const DEFAULT_MONTHLY_LIMIT = 30;
const DEFAULT_RPM_LIMIT = 10;

export type MentorLimitConfig = {
  monthlyMessageLimit: number;
  requestsPerMinuteLimit: number;
  requireRedisInProduction: boolean;
};

export function getMentorLimitConfig(
  env: Record<string, string | undefined> = process.env,
): MentorLimitConfig {
  const monthly = env.AI_MENTOR_MONTHLY_LIMIT;
  const rpm = env.AI_MENTOR_RPM_LIMIT;
  const requireRedis = env.MENTOR_REQUIRE_REDIS;

  return {
    monthlyMessageLimit: monthly
      ? Number.parseInt(monthly, 10)
      : DEFAULT_MONTHLY_LIMIT,
    requestsPerMinuteLimit: rpm
      ? Number.parseInt(rpm, 10)
      : DEFAULT_RPM_LIMIT,
    requireRedisInProduction:
      requireRedis === undefined
        ? env.NODE_ENV === "production"
        : requireRedis === "true",
  };
}
