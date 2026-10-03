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

export function isMentorProductionRuntime(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.NODE_ENV === "production";
}

/**
 * Production always requires Redis for mentor state/quota (M3 plan §11).
 * MENTOR_REQUIRE_REDIS only affects non-production environments.
 */
export function mentorRequiresRedisBackend(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isMentorProductionRuntime(env)) {
    return true;
  }
  return env.MENTOR_REQUIRE_REDIS === "true";
}

export function getMentorLimitConfig(
  env: Record<string, string | undefined> = process.env,
): MentorLimitConfig {
  const monthly = env.AI_MENTOR_MONTHLY_LIMIT;
  const rpm = env.AI_MENTOR_RPM_LIMIT;

  return {
    monthlyMessageLimit: monthly
      ? Number.parseInt(monthly, 10)
      : DEFAULT_MONTHLY_LIMIT,
    requestsPerMinuteLimit: rpm
      ? Number.parseInt(rpm, 10)
      : DEFAULT_RPM_LIMIT,
    requireRedisInProduction: mentorRequiresRedisBackend(env),
  };
}
