export type MentorGenerateInput = {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
};

export type MentorGenerateUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type MentorGenerateResult = {
  text: string;
  model: string;
  usage?: MentorGenerateUsage;
};

export interface AIService {
  generateText(input: MentorGenerateInput): Promise<MentorGenerateResult>;
}

export type AIProviderId = "mock" | "openai";
