import type {
  AIService,
  MentorGenerateInput,
  MentorGenerateResult,
} from "@/ai/types";

export type MockProviderOptions = {
  model?: string;
  fixedText?: string;
};

/**
 * Deterministic provider for CI — no network calls.
 */
export class MockProvider implements AIService {
  readonly model: string;
  private readonly fixedText: string;

  constructor(options: MockProviderOptions = {}) {
    this.model = options.model ?? "mock-mentor-v1";
    this.fixedText =
      options.fixedText ??
      "Let's look at what this exercise is asking you to do, one step at a time.";
  }

  async generateText(input: MentorGenerateInput): Promise<MentorGenerateResult> {
    const seed = `${input.systemPrompt.length}:${input.userPrompt.length}`;
    return {
      text: `${this.fixedText} [mock:${seed}]`,
      model: this.model,
      usage: { inputTokens: 10, outputTokens: 20 },
    };
  }
}
