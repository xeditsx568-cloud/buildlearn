import { Ratelimit } from "@upstash/ratelimit";

import { getMentorLimitConfig } from "@/lib/ai/mentor-config";
import {
  MentorQuotaExceededError,
  MentorRateLimitError,
  MentorServiceUnavailableError,
} from "@/server/services/mentor-errors";
import {
  RELEASE_MONTHLY_QUOTA_SCRIPT,
  RESERVE_MONTHLY_QUOTA_SCRIPT,
} from "@/server/services/mentor-quota-monthly";
import {
  isMentorRedisConfigured,
  requireMentorRedis,
} from "@/server/services/mentor-redis-client";

export type MentorQuotaStatus = {
  remainingThisMonth: number;
  limitThisMonth: number;
  resetAt: string;
};

export function monthQuotaKey(userId: string, now = new Date()): string {
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

function statusFromUsed(
  used: number,
  config: ReturnType<typeof getMentorLimitConfig>,
): MentorQuotaStatus {
  return {
    remainingThisMonth: Math.max(0, config.monthlyMessageLimit - used),
    limitThisMonth: config.monthlyMessageLimit,
    resetAt: monthResetAt(),
  };
}

/** In-memory quota for dev/test when Redis is not configured. */
class InMemoryMentorQuotaService {
  private readonly monthly = new Map<string, number>();
  private readonly rpm = new Map<string, { count: number; windowStart: number }>();
  private readonly monthlyLocks = new Map<string, Promise<void>>();

  private async withMonthlyLock<T>(
    key: string,
    fn: () => Promise<T> | T,
  ): Promise<T> {
    const previous = this.monthlyLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.monthlyLocks.set(
      key,
      previous.then(() => gate),
    );
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async getStatus(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const key = monthQuotaKey(userId);
    const used = this.monthly.get(key) ?? 0;
    return statusFromUsed(used, config);
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

    return this.getStatus(userId);
  }

  async reserveMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const key = monthQuotaKey(userId);

    return this.withMonthlyLock(key, () => {
      const used = this.monthly.get(key) ?? 0;
      if (used >= config.monthlyMessageLimit) {
        throw new MentorQuotaExceededError(
          undefined,
          secondsUntilMonthReset(),
        );
      }
      this.monthly.set(key, used + 1);
      return statusFromUsed(used + 1, config);
    });
  }

  async releaseMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const key = monthQuotaKey(userId);

    return this.withMonthlyLock(key, () => {
      const used = this.monthly.get(key) ?? 0;
      const next = Math.max(0, used - 1);
      this.monthly.set(key, next);
      return statusFromUsed(next, config);
    });
  }
}

class RedisMentorQuotaService {
  async getStatus(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const redis = requireMentorRedis();
    const usedRaw = await redis.get<number>(monthQuotaKey(userId));
    const used = typeof usedRaw === "number" ? usedRaw : 0;
    return statusFromUsed(used, config);
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

    return this.getStatus(userId);
  }

  async reserveMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus> {
    const config = getMentorLimitConfig();
    const redis = requireMentorRedis();
    const key = monthQuotaKey(userId);
    const result = await redis.eval(
      RESERVE_MONTHLY_QUOTA_SCRIPT,
      [key],
      [String(config.monthlyMessageLimit), String(secondsUntilMonthReset())],
    );
    const used =
      typeof result === "number" ? result : Number.parseInt(String(result), 10);

    if (used < 0) {
      throw new MentorQuotaExceededError(
        undefined,
        secondsUntilMonthReset(),
      );
    }

    return statusFromUsed(used, config);
  }

  async releaseMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus> {
    const redis = requireMentorRedis();
    await redis.eval(RELEASE_MONTHLY_QUOTA_SCRIPT, [monthQuotaKey(userId)], []);
    return this.getStatus(userId);
  }
}

export interface MentorQuotaService {
  getStatus(userId: string): Promise<MentorQuotaStatus>;
  /** RPM enforcement only — monthly quota uses reserve/release. */
  assertCanRequestHelp(userId: string): Promise<MentorQuotaStatus>;
  /** Atomically reserve one monthly AI slot before calling the provider. */
  reserveMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus>;
  /** Release a reservation when AI is not used (fallback / provider failure). */
  releaseMonthlyAiQuota(userId: string): Promise<MentorQuotaStatus>;
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
