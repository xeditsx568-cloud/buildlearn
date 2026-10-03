import { describe, expect, it } from "vitest";

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
  it("defaults to mock provider", async () => {
    const service = createAIService();
    const result = await service.generateText({
      systemPrompt: "teach",
      userPrompt: "help",
    });
    expect(result.text).toContain("mock:");
  });
});
