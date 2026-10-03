import { Ratelimit } from "@upstash/ratelimit";

import { getMentorLimitConfig } from "@/lib/ai/mentor-config";
import {
  MentorQuotaExceededError,
  MentorRateLimitError,
  MentorServiceUnavailableError,
} from "@/server/services/mentor-errors";
import {
  isMentorRedisConfigured,
  requireMentorRedis,
} from "@/server/services/mentor-redis-client";

export type MentorQuotaStatus = {
  remainingThisMonth: number;
  limitThisMonth: number;
  resetAt: string;
};

export type MentorQuotaCheckResult =
  | { ok: true; status: MentorQuotaStatus }
  | { ok: false; reason: "monthly_exhausted" | "rpm_exceeded" | "redis_unavailable" };

function monthKey(userId: string, now = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `mentor:month:${userId}:${yyyy}-${mm}`;
}

function monthResetAt(now = new Date()): string {
  const reset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
  );
  return reset.toISOString();
}

function secondsUntilMonthReset(now = new Date()): number {
  const reset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
  );
  return Math.max(1, Math.ceil((reset.getTime() - now.getTime()) / 1000));
}

let cachedRatelimit: Ratelimit | null = null;

function getRpmLimiter(): Ratelimit {
  const config = getMentorLimitConfig();
  if (!cachedRatelimit) {
    cachedRatelimit = new Ratelimit({
      redis: requireMentorRedis(),
      limiter: Ratelimit.slidingWindow(
        config.requestsPerMinuteLimit,
        "1 m",
      ),
      prefix: "mentor:rpm",
    });
  }
  return cachedRatelimit;
}

/** In-memory quota for dev/test when Redis is not configured. */
class InMemoryMentorQuotaService {
  private readonly monthly = new Map<string, number>();
  private readonly rpm = new Map<string, { count: number; windowStart: number }>();

  async getStatus(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const key = monthKey(userId);
    const used = this.monthly.get(key) ?? 0;
    return {
      remainingThisMonth: Math.max(0, config.monthlyMessageLimit - used),
      limitThisMonth: config.monthlyMessageLimit,
      resetAt: monthResetAt(),
    };
  }

  async assertCanRequestHelp(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const now = Date.now();
    const rpmKey = userId;
    const window = this.rpm.get(rpmKey);
    if (!window || now - window.windowStart >= 60_000) {
      this.rpm.set(rpmKey, { count: 1, windowStart: now });
    } else if (window.count >= config.requestsPerMinuteLimit) {
      throw new MentorRateLimitError(undefined, 60);
    } else {
      window.count += 1;
    }

    const status = await this.getStatus(userId);
    if (status.remainingThisMonth <= 0) {
      throw new MentorQuotaExceededError(
        undefined,
        secondsUntilMonthReset(),
      );
    }
    return status;
  }

  async recordBillableHelp(userId: string): Promise<MentorQuotaStatus> {
    const key = monthKey(userId);
    this.monthly.set(key, (this.monthly.get(key) ?? 0) + 1);
    return this.getStatus(userId);
  }
}

class RedisMentorQuotaService {
  async getStatus(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const redis = requireMentorRedis();
    const usedRaw = await redis.get<number>(monthKey(userId));
    const used = typeof usedRaw === "number" ? usedRaw : 0;
    return {
      remainingThisMonth: Math.max(0, config.monthlyMessageLimit - used),
      limitThisMonth: config.monthlyMessageLimit,
      resetAt: monthResetAt(),
    };
  }

  async assertCanRequestHelp(userId: string): Promise<MentorQuotaStatus> {
    const limiter = getRpmLimiter();
    const rpm = await limiter.limit(userId);
    if (!rpm.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rpm.reset - Date.now()) / 1000),
      );
      throw new MentorRateLimitError(undefined, retryAfter);
    }

    const status = await this.getStatus(userId);
    if (status.remainingThisMonth <= 0) {
      throw new MentorQuotaExceededError(
        undefined,
        secondsUntilMonthReset(),
      );
    }
    return status;
  }

  async recordBillableHelp(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const redis = requireMentorRedis();
    const key = monthKey(userId);
    const used = await redis.incr(key);
    if (used === 1) {
      await redis.expire(key, secondsUntilMonthReset());
    }
    const remaining = Math.max(0, config.monthlyMessageLimit - used);
    if (remaining < 0) {
      throw new MentorQuotaExceededError(
        undefined,
        secondsUntilMonthReset(),
      );
    }
    return {
      remainingThisMonth: remaining,
      limitThisMonth: config.monthlyMessageLimit,
      resetAt: monthResetAt(),
    };
  }
}

export interface MentorQuotaService {
  getStatus(userId: string): Promise<MentorQuotaStatus>;
  assertCanRequestHelp(userId: string): Promise<MentorQuotaStatus>;
  recordBillableHelp(userId: string): Promise<MentorQuotaStatus>;
}

let inMemoryQuota: InMemoryMentorQuotaService | null = null;

export function createMentorQuotaService(): MentorQuotaService {
  const config = getMentorLimitConfig();
  if (config.requireRedisInProduction && !isMentorRedisConfigured()) {
    throw new MentorServiceUnavailableError();
  }
  if (isMentorRedisConfigured()) {
    return new RedisMentorQuotaService();
  }
  if (!inMemoryQuota) {
    inMemoryQuota = new InMemoryMentorQuotaService();
  }
  return inMemoryQuota;
}

export function resetMentorQuotaServiceForTests(): void {
  inMemoryQuota = null;
  cachedRatelimit = null;
}

export async function safeGetMentorQuotaStatus(
  userId: string,
): Promise<MentorQuotaStatus | null> {
  try {
    return await createMentorQuotaService().getStatus(userId);
  } catch (error) {
    if (error instanceof MentorServiceUnavailableError) {
      return null;
    }
    throw error;
  }
}
