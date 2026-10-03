import { MockProvider } from "@/ai/providers/mock-provider";
import type { AIService, AIProviderId } from "@/ai/types";

export type CreateAIServiceOptions = {
  provider?: AIProviderId;
};

/**
 * Factory for mentor AIService implementations.
 * OpenAI wiring lands in Wave 1; Wave 0 uses MockProvider in tests/CI.
 */
export function createAIService(
  options: CreateAIServiceOptions = {},
): AIService {
  const provider = options.provider ?? "mock";

  switch (provider) {
    case "mock":
      return new MockProvider();
    case "openai":
      throw new Error(
        "OpenAI provider is not configured in MVP-M3 Wave 0. Use mock or implement in Wave 1.",
      );
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}
