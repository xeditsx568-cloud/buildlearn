import { applyBillableHelpDelivered } from "@/ai/mentor/help-policy";
import { buildMentorContext } from "@/ai/mentor/context-builder";
import { buildFallbackMentorMessage } from "@/ai/mentor/fallback-copy";
import {
  buildLessonMentorSystemPrompt,
  buildLessonMentorUserPrompt,
} from "@/ai/prompts/lesson-mentor-v1";
import { createAIService } from "@/ai/aiservice";
import type { AIService } from "@/ai/types";
import type {
  MentorHelpRequest,
  MentorHelpResponse,
} from "@/lib/ai/mentor-contracts";
import type { LessonPlayerPayload } from "@/lib/lesson-player/contracts";
import type { ExperienceLevel } from "@prisma/client";
import { createMentorBlockStateStore } from "@/server/services/mentor-block-state-service";
import type {
  MentorBlockScope,
  MentorBlockStateStore,
} from "@/server/services/mentor-block-state-store";
import { incrementHintsUsedForMentorHelp } from "@/server/services/mentor-hints-service";
import {
  createMentorQuotaService,
  type MentorQuotaService,
} from "@/server/services/mentor-quota-service";
import {
  MentorAIUnavailableError,
  MentorServiceUnavailableError,
} from "@/server/services/mentor-errors";

/**
 * P1 contract: help advances Redis state + hints_used for both AI and fallback.
 * Monthly AI quota is reserved before the provider call; released on fallback only.
 * Use X-Mentor-Response-Source (ai | fallback) to distinguish delivery mode.
 */

const FULL_SOLUTION_PATTERN =
  /\b(write|give|show)\s+(me\s+)?(the\s+)?(full|complete|entire)\s+(solution|code|answer)\b/i;

export type MentorHelpOrchestratorDeps = {
  stateStore?: MentorBlockStateStore;
  quotaService?: MentorQuotaService;
  aiService?: AIService;
};

function suggestedActions(
  helpLevel: MentorHelpResponse["helpLevel"],
): MentorHelpResponse["suggestedActions"] {
  if (helpLevel >= 4) {
    return ["try_again", "explain_last_check"];
  }
  if (helpLevel >= 2) {
    return ["try_again", "need_more_help", "explain_last_check"];
  }
  return ["try_again", "need_more_help"];
}

function maybeEditorFocus(
  context: ReturnType<typeof buildMentorContext>,
): MentorHelpResponse["editorFocus"] {
  if (context.effectiveHelpLevel < 2) {
    return undefined;
  }
  const code = context.learnerCode ?? context.starterCode;
  if (!code) {
    return undefined;
  }
  const htmlLine = code.split("\n").findIndex((line) => /<html/i.test(line));
  if (htmlLine >= 0) {
    return {
      startLine: htmlLine + 1,
      endLine: htmlLine + 1,
      label: "Look near the html element",
    };
  }
  return undefined;
}

function resolveAIService(deps?: MentorHelpOrchestratorDeps): AIService | null {
  if (deps?.aiService) {
    return deps.aiService;
  }
  try {
    return createAIService();
  } catch (error) {
    if (error instanceof MentorAIUnavailableError) {
      return null;
    }
    throw error;
  }
}

export type MentorHelpResult = MentorHelpResponse & {
  responseSource: "ai" | "fallback";
};

export async function runMentorHelp(input: {
  userId: string;
  lesson: LessonPlayerPayload;
  request: MentorHelpRequest;
  experienceLevel?: ExperienceLevel | null;
  learningGoalText?: string | null;
  deps?: MentorHelpOrchestratorDeps;
}): Promise<MentorHelpResult> {
  const stateStore = input.deps?.stateStore ?? createMentorBlockStateStore();
  const quotaService = input.deps?.quotaService ?? createMentorQuotaService();

  const scope: MentorBlockScope = {
    userId: input.userId,
    lessonId: input.request.lessonId,
    blockIndex: input.request.blockIndex,
  };

  const blockState = await stateStore.get(scope);
  const context = buildMentorContext({
    lesson: input.lesson,
    blockIndex: input.request.blockIndex,
    request: input.request,
    blockState,
    experienceLevel: input.experienceLevel,
    learningGoalText: input.learningGoalText,
  });

  if (
    context.effectiveHelpLevel <= 2 &&
    input.request.learnerQuestion &&
    FULL_SOLUTION_PATTERN.test(input.request.learnerQuestion)
  ) {
    throw new Error(
      "Ask for step-by-step help instead of a full solution at this level",
    );
  }

  await quotaService.assertCanRequestHelp(input.userId);
  let quotaStatus = await quotaService.reserveMonthlyAiQuota(input.userId);
  let monthlyQuotaCommitted = false;

  let message: string;
  let responseSource: "ai" | "fallback" = "ai";

  const aiService = resolveAIService(input.deps);

  try {
    if (!aiService) {
      throw new MentorAIUnavailableError();
    }
    const systemPrompt = buildLessonMentorSystemPrompt(context);
    const userPrompt = buildLessonMentorUserPrompt(context);
    const result = await aiService.generateText({ systemPrompt, userPrompt });
    message = result.text.trim();
    if (!message) {
      throw new Error("Empty mentor response");
    }
    monthlyQuotaCommitted = true;
  } catch (error) {
    if (error instanceof MentorServiceUnavailableError) {
      if (!monthlyQuotaCommitted) {
        quotaStatus = await quotaService.releaseMonthlyAiQuota(input.userId);
      }
      throw error;
    }
    if (!monthlyQuotaCommitted) {
      quotaStatus = await quotaService.releaseMonthlyAiQuota(input.userId);
    }
    responseSource = "fallback";
    message = buildFallbackMentorMessage({
      block: context.block,
      helpLevel: context.effectiveHelpLevel,
      graderMessage: context.graderMessage,
    });
  }

  const nextState = applyBillableHelpDelivered(
    blockState,
    context.effectiveHelpLevel,
  );
  await stateStore.set(scope, nextState);

  if (monthlyQuotaCommitted) {
    quotaStatus = await quotaService.getStatus(input.userId);
  }

  await incrementHintsUsedForMentorHelp(input.userId, input.request.lessonId);

  return {
    helpLevel: context.effectiveHelpLevel,
    message,
    editorFocus: maybeEditorFocus(context),
    quota: {
      remainingThisMonth: quotaStatus.remainingThisMonth,
      resetAt: quotaStatus.resetAt,
    },
    suggestedActions: suggestedActions(context.effectiveHelpLevel),
    responseSource,
  };
}
