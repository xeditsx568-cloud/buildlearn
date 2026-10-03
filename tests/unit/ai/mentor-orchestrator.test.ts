import { describe, expect, it, vi } from "vitest";

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
  it("uses fallback when provider fails", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    resetMentorQuotaServiceForTests();

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
        quotaService: createMentorQuotaService(),
        aiService: failingAi,
      },
    });

    expect(result.responseSource).toBe("fallback");
    expect(result.message).toContain("Static mentor help");
    expect(result.helpLevel).toBe(1);
  });

  it("updates block state after AI help", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    resetMentorQuotaServiceForTests();

    const store = new InMemoryMentorBlockStateStore();
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
        quotaService: createMentorQuotaService(),
        aiService: new MockProvider(),
      },
    });

    expect(result.responseSource).toBe("ai");
    const state = await store.get({
      userId: "user_orch2",
      lessonId: "how-websites-work",
      blockIndex: 3,
    });
    expect(state.helpTurnCount).toBe(1);
    expect(state.lastLevelDelivered).toBe(1);
  });
});
