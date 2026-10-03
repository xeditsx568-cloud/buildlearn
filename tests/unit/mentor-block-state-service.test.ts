import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMentorBlockStateStore,
  resolveMentorStoreMode,
  resetMentorBlockStateStoreForTests,
} from "@/server/services/mentor-block-state-service";
import { resetMentorRedisClientForTests } from "@/server/services/mentor-redis-client";
import { MentorServiceUnavailableError } from "@/server/services/mentor-errors";

describe("mentor block state store factory", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    resetMentorBlockStateStoreForTests();
    resetMentorRedisClientForTests();
    vi.unstubAllEnvs();
  });

  it("uses memory in non-production without Redis", () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.MENTOR_REQUIRE_REDIS;

    expect(resolveMentorStoreMode()).toBe("memory");
    expect(createMentorBlockStateStore().constructor.name).toBe(
      "InMemoryMentorBlockStateStore",
    );
  });

  it("throws in production when Redis is required but missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.MENTOR_REQUIRE_REDIS;

    expect(() => resolveMentorStoreMode()).toThrow(MentorServiceUnavailableError);
    expect(() => createMentorBlockStateStore()).toThrow(
      MentorServiceUnavailableError,
    );
  });

  it("ignores MENTOR_REQUIRE_REDIS=false in production (no in-memory fallback)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MENTOR_REQUIRE_REDIS", "false");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(() => resolveMentorStoreMode()).toThrow(MentorServiceUnavailableError);
    expect(() => createMentorBlockStateStore()).toThrow(
      MentorServiceUnavailableError,
    );
  });
});
