import { afterEach, describe, expect, it, vi } from "vitest";

import { createAIService } from "@/ai/aiservice";
import { MockProvider } from "@/ai/providers/mock-provider";

describe("MockProvider", () => {
  it("returns deterministic text without network", async () => {
    const provider = new MockProvider();
    const a = await provider.generateText({
      systemPrompt: "sys",
      userPrompt: "user",
    });
    const b = await provider.generateText({
      systemPrompt: "sys",
      userPrompt: "user",
    });
    expect(a.text).toBe(b.text);
    expect(a.model).toBe("mock-mentor-v1");
  });
});

describe("createAIService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to mock provider in non-production test env", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.OPENAI_API_KEY;
    const service = createAIService();
    const result = await service.generateText({
      systemPrompt: "teach",
      userPrompt: "help",
    });
    expect(result.text).toContain("mock:");
  });
});
