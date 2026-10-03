import { MockProvider } from "@/ai/providers/mock-provider";
import { OpenAIProvider } from "@/ai/providers/openai-provider";
import type { AIService, AIProviderId } from "@/ai/types";
import { isMentorProductionRuntime } from "@/lib/ai/mentor-config";
import { env } from "@/env";
import { MentorAIUnavailableError } from "@/server/services/mentor-errors";

export type CreateAIServiceOptions = {
  provider?: AIProviderId;
};

function assertMockAllowedInRuntime(): void {
  if (isMentorProductionRuntime()) {
    throw new MentorAIUnavailableError(
      "MockProvider cannot be used in production",
    );
  }
}

/**
 * Factory for mentor AIService implementations.
 * Production never auto-selects MockProvider; missing OpenAI key → unavailable.
 */
export function createAIService(
  options: CreateAIServiceOptions = {},
): AIService {
  if (options.provider === "mock") {
    assertMockAllowedInRuntime();
    return new MockProvider();
  }

  if (options.provider === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new MentorAIUnavailableError();
    }
    return new OpenAIProvider();
  }

  if (isMentorProductionRuntime()) {
    if (!env.OPENAI_API_KEY) {
      throw new MentorAIUnavailableError();
    }
    return new OpenAIProvider();
  }

  if (env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  return new MockProvider();
}
