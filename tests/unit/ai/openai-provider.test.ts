import { describe, expect, it, vi } from "vitest";

const mockGenerateText = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => (model: string) => model,
}));

vi.mock("@/env", () => ({
  env: {
    OPENAI_API_KEY: "sk-test",
    AI_MENTOR_MODEL: "gpt-4o-mini",
  },
}));

import { OpenAIProvider } from "@/ai/providers/openai-provider";

describe("OpenAIProvider", () => {
  it("calls AI SDK generateText without live network in tests", async () => {
    mockGenerateText.mockResolvedValue({
      text: "Try adding a comment above the html tag.",
      usage: { inputTokens: 1, outputTokens: 2 },
    });

    const provider = new OpenAIProvider("gpt-4o-mini");
    const result = await provider.generateText({
      systemPrompt: "sys",
      userPrompt: "user",
    });

    expect(result.text).toContain("comment");
    expect(mockGenerateText).toHaveBeenCalled();
  });
});
