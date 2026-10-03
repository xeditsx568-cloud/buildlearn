import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/mentor-hints-service", () => ({
  incrementHintsUsedForMentorHelp: vi.fn().mockResolvedValue(1),
}));

import { runMentorHelp } from "@/ai/mentor/orchestrator";
import { MockProvider } from "@/ai/providers/mock-provider";
import { InMemoryMentorBlockStateStore } from "@/server/services/mentor-block-state-store";
import {
  createMentorQuotaService,
  resetMentorQuotaServiceForTests,
} from "@/server/services/mentor-quota-service";
import { L1_LESSON_PAYLOAD } from "../../fixtures/l1-lesson-payload";

describe("runMentorHelp", () => {
  afterEach(() => {
    resetMentorQuotaServiceForTests();
    vi.unstubAllEnvs();
  });

  it("uses fallback when provider fails and releases monthly quota", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AI_MENTOR_MONTHLY_LIMIT", "1");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const quotaService = createMentorQuotaService();
    const failingAi = {
      generateText: vi.fn().mockRejectedValue(new Error("provider down")),
    };

    const result = await runMentorHelp({
      userId: "user_orch",
      lesson: L1_LESSON_PAYLOAD,
      request: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        action: "get_help",
      },
      deps: {
        stateStore: new InMemoryMentorBlockStateStore(),
        quotaService,
        aiService: failingAi,
      },
    });

    expect(result.responseSource).toBe("fallback");
    expect(result.message).toContain("Static mentor help");
    expect(result.helpLevel).toBe(1);
    const status = await quotaService.getStatus("user_orch");
    expect(status.remainingThisMonth).toBe(1);
  });

  it("uses fallback in production when OpenAI is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    const quotaService = createMentorQuotaService();
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.OPENAI_API_KEY;
    const result = await runMentorHelp({
      userId: "user_prod_fb",
      lesson: L1_LESSON_PAYLOAD,
      request: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        action: "get_help",
      },
      deps: {
        stateStore: new InMemoryMentorBlockStateStore(),
        quotaService,
      },
    });

    expect(result.responseSource).toBe("fallback");
    expect(result.message).toContain("Static mentor help");
  });

  it("updates block state after AI help and consumes monthly quota", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;

    const store = new InMemoryMentorBlockStateStore();
    const quotaService = createMentorQuotaService();
    const before = await quotaService.getStatus("user_orch2");

    const result = await runMentorHelp({
      userId: "user_orch2",
      lesson: L1_LESSON_PAYLOAD,
      request: {
        lessonId: "how-websites-work",
        blockIndex: 3,
        action: "get_help",
      },
      deps: {
        stateStore: store,
        quotaService,
        aiService: new MockProvider(),
      },
    });

    expect(result.responseSource).toBe("ai");
    const after = await quotaService.getStatus("user_orch2");
    expect(after.remainingThisMonth).toBe(before.remainingThisMonth - 1);

    const state = await store.get({
      userId: "user_orch2",
      lessonId: "how-websites-work",
      blockIndex: 3,
    });
    expect(state.helpTurnCount).toBe(1);
    expect(state.lastLevelDelivered).toBe(1);
  });
});
