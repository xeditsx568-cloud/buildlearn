import {
  createInitialMentorBlockState,
  mentorBlockStateSchema,
  type MentorBlockState,
} from "@/lib/ai/mentor-contracts";
import { applyServerGraderResult } from "@/ai/mentor/help-policy";
import { getMentorLimitConfig } from "@/lib/ai/mentor-config";
import {
  InMemoryMentorBlockStateStore,
  type MentorBlockScope,
  type MentorBlockStateStore,
} from "@/server/services/mentor-block-state-store";
import { MentorServiceUnavailableError } from "@/server/services/mentor-errors";
import {
  isMentorRedisConfigured,
  requireMentorRedis,
} from "@/server/services/mentor-redis-client";

const STATE_TTL_SECONDS = 7 * 24 * 60 * 60;

export function mentorStateRedisKey(scope: MentorBlockScope): string {
  return `mentor:state:${scope.userId}:${scope.lessonId}:${scope.blockIndex}`;
}

export class RedisMentorBlockStateStore implements MentorBlockStateStore {
  async get(scope: MentorBlockScope): Promise<MentorBlockState> {
    const redis = requireMentorRedis();
    const raw = await redis.get<string>(mentorStateRedisKey(scope));
    if (!raw) {
      return createInitialMentorBlockState();
    }

    try {
      const parsed =
        typeof raw === "string" ? JSON.parse(raw) : (raw as MentorBlockState);
      return mentorBlockStateSchema.parse(parsed);
    } catch {
      return createInitialMentorBlockState();
    }
  }

  async set(scope: MentorBlockScope, state: MentorBlockState): Promise<void> {
    const redis = requireMentorRedis();
    await redis.set(mentorStateRedisKey(scope), JSON.stringify(state), {
      ex: STATE_TTL_SECONDS,
    });
  }

  async applyGraderResult(
    scope: MentorBlockScope,
    passed: boolean,
    message: string,
  ): Promise<MentorBlockState> {
    const current = await this.get(scope);
    const next = applyServerGraderResult(current, passed, message);
    await this.set(scope, next);
    return next;
  }
}

let devInMemoryStore: InMemoryMentorBlockStateStore | null = null;
let warnedInMemory = false;

function getDevInMemoryStore(): InMemoryMentorBlockStateStore {
  if (!devInMemoryStore) {
    devInMemoryStore = new InMemoryMentorBlockStateStore();
  }
  return devInMemoryStore;
}

export type MentorStoreMode = "redis" | "memory";

export function resolveMentorStoreMode(): MentorStoreMode {
  const config = getMentorLimitConfig();
  if (config.requireRedisInProduction) {
    if (!isMentorRedisConfigured()) {
      throw new MentorServiceUnavailableError();
    }
    return "redis";
  }

  if (isMentorRedisConfigured()) {
    return "redis";
  }

  if (!warnedInMemory) {
    warnedInMemory = true;
    console.warn(
      "[mentor] Using in-memory block state store (development/test only).",
    );
  }
  return "memory";
}

export function createMentorBlockStateStore(): MentorBlockStateStore {
  const mode = resolveMentorStoreMode();
  if (mode === "redis") {
    return new RedisMentorBlockStateStore();
  }
  return getDevInMemoryStore();
}

/** Reset dev singleton — tests only. */
export function resetMentorBlockStateStoreForTests(): void {
  devInMemoryStore = null;
  warnedInMemory = false;
}
