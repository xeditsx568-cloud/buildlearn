import { Redis } from "@upstash/redis";

import { env } from "@/env";
import { getMentorLimitConfig } from "@/lib/ai/mentor-config";
import { MentorServiceUnavailableError } from "@/server/services/mentor-errors";

let cachedRedis: Redis | null = null;

export function isMentorRedisConfigured(): boolean {
  return Boolean(
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export function requireMentorRedis(): Redis {
  const config = getMentorLimitConfig();

  if (!isMentorRedisConfigured()) {
    if (config.requireRedisInProduction) {
      throw new MentorServiceUnavailableError();
    }
    throw new MentorServiceUnavailableError(
      "Redis is not configured for mentor services",
    );
  }

  if (!cachedRedis) {
    cachedRedis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return cachedRedis;
}

/** Test hook — reset singleton between tests. */
export function resetMentorRedisClientForTests(): void {
  cachedRedis = null;
}
