import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import type {
  AIService,
  MentorGenerateInput,
  MentorGenerateResult,
} from "@/ai/types";
import { env } from "@/env";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements AIService {
  readonly model: string;

  constructor(model?: string) {
    this.model = model ?? env.AI_MENTOR_MODEL ?? DEFAULT_MODEL;
  }

  async generateText(input: MentorGenerateInput): Promise<MentorGenerateResult> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    const result = await generateText({
      model: openai(this.model),
      system: input.systemPrompt,
      prompt: input.userPrompt,
      maxOutputTokens: input.maxOutputTokens ?? 800,
    });

    return {
      text: result.text,
      model: this.model,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
          }
        : undefined,
    };
  }
}
