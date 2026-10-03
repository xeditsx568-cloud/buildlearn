import { afterEach, describe, expect, it, vi } from "vitest";

import { MockProvider } from "@/ai/providers/mock-provider";
import { MentorAIUnavailableError } from "@/server/services/mentor-errors";

vi.mock("@/env", () => ({
  env: {
    OPENAI_API_KEY: undefined as string | undefined,
    AI_MENTOR_MODEL: "gpt-4o-mini",
  },
}));

import { createAIService } from "@/ai/aiservice";

describe("createAIService production safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never auto-selects MockProvider in production without OpenAI key", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createAIService()).toThrow(MentorAIUnavailableError);
  });

  it("rejects explicit mock provider in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createAIService({ provider: "mock" })).toThrow(
      MentorAIUnavailableError,
    );
  });
});

describe("createAIService non-production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses deterministic MockProvider in test when OpenAI key absent", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const service = createAIService();
    expect(service).toBeInstanceOf(MockProvider);
    const result = await service.generateText({
      systemPrompt: "sys",
      userPrompt: "user",
    });
    expect(result.text).toContain("mock:");
  });
});
