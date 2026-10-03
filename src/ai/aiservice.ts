import { MockProvider } from "@/ai/providers/mock-provider";
import { OpenAIProvider } from "@/ai/providers/openai-provider";
import type { AIService, AIProviderId } from "@/ai/types";
import { env } from "@/env";

export type CreateAIServiceOptions = {
  provider?: AIProviderId;
};

/**
 * Factory for mentor AIService implementations.
 */
export function createAIService(
  options: CreateAIServiceOptions = {},
): AIService {
  const provider =
    options.provider ??
    (env.OPENAI_API_KEY ? ("openai" as const) : ("mock" as const));

  switch (provider) {
    case "mock":
      return new MockProvider();
    case "openai":
      return new OpenAIProvider();
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}
