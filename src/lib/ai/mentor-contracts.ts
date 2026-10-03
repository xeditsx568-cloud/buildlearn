import { z } from "zod";

/** MVP-M3 Lesson 1 vertical slice only. */
export const M3_MENTOR_LESSON_ID = "how-websites-work" as const;

export const mentorLessonIdSchema = z.literal(M3_MENTOR_LESSON_ID);

export const helpLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export type HelpLevel = z.infer<typeof helpLevelSchema>;

export const mentorHelpActionSchema = z.enum([
  "get_help",
  "explain_task",
  "explain_last_check",
  "need_more_help",
]);

export type MentorHelpAction = z.infer<typeof mentorHelpActionSchema>;

const FORBIDDEN_AUTHORITATIVE_KEYS = [
  "passed",
  "failed",
  "failedChecksSinceLastPass",
  "failedChecksAtLastHelp",
  "lastHelpLevelDelivered",
  "lastLevelDelivered",
  "helpTurnCount",
  "hintsUsed",
  "hints_used",
] as const;

function rejectAuthoritativeKeys(value: unknown, ctx: z.RefinementCtx) {
  if (value === null || typeof value !== "object") {
    return;
  }
  for (const key of FORBIDDEN_AUTHORITATIVE_KEYS) {
    if (key in (value as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Client must not send authoritative field: ${key}`,
        path: [key],
      });
    }
  }
}

const mentorTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

/** Client context for POST /api/ai/mentor/help (Wave 1). */
export const mentorHelpRequestSchema = z
  .object({
    lessonId: mentorLessonIdSchema,
    blockIndex: z.number().int().min(0),
    action: mentorHelpActionSchema,
    learnerCode: z.string().max(8_192).optional(),
    lastGraderResult: z
      .object({
        passed: z.boolean(),
        message: z.string().max(500),
      })
      .optional(),
    clientUx: z
      .object({
        secondsOnBlock: z.number().int().min(0).max(86_400),
      })
      .optional(),
    learnerQuestion: z.string().max(280).optional(),
    recentTurns: z.array(mentorTurnSchema).max(6).optional(),
  })
  .strict()
  .superRefine(rejectAuthoritativeKeys);

export type MentorHelpRequest = z.infer<typeof mentorHelpRequestSchema>;

/** POST /api/ai/mentor/grader-event — code/option only; server grades. */
export const mentorGraderEventRequestSchema = z
  .object({
    lessonId: mentorLessonIdSchema,
    blockIndex: z.number().int().min(0),
    learnerCode: z.string().max(8_192).optional(),
    selectedOptionId: z.string().min(1).max(64).optional(),
  })
  .strict()
  .superRefine(rejectAuthoritativeKeys);

export type MentorGraderEventRequest = z.infer<
  typeof mentorGraderEventRequestSchema
>;

export const mentorBlockStateSchema = z.object({
  lastLevelDelivered: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  helpTurnCount: z.number().int().min(0),
  failedChecksSinceLastPass: z.number().int().min(0),
  failedChecksAtLastHelp: z.number().int().min(0),
  lastGraderMessage: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export type MentorBlockState = z.infer<typeof mentorBlockStateSchema>;

export const mentorGraderEventResponseSchema = z.object({
  passed: z.boolean(),
  message: z.string(),
  blockState: z.object({
    failedChecksSinceLastPass: z.number().int().min(0),
    lastLevelDelivered: mentorBlockStateSchema.shape.lastLevelDelivered,
    helpTurnCount: z.number().int().min(0),
  }),
});

export type MentorGraderEventResponse = z.infer<
  typeof mentorGraderEventResponseSchema
>;

export const mentorHelpResponseSchema = z.object({
  helpLevel: helpLevelSchema,
  message: z.string(),
  editorFocus: z
    .object({
      startLine: z.number().int().min(1),
      endLine: z.number().int().min(1),
      label: z.string().min(1),
    })
    .optional(),
  quota: z.object({
    remainingThisMonth: z.number().int().min(0),
    resetAt: z.string(),
  }),
  suggestedActions: z.array(
    z.enum(["try_again", "need_more_help", "explain_last_check"]),
  ),
});

export type MentorHelpResponse = z.infer<typeof mentorHelpResponseSchema>;

export const MENTOR_MAX_REQUEST_BODY_BYTES = 32 * 1024;

export function createInitialMentorBlockState(
  now: Date = new Date(),
): MentorBlockState {
  return {
    lastLevelDelivered: 0,
    helpTurnCount: 0,
    failedChecksSinceLastPass: 0,
    failedChecksAtLastHelp: 0,
    lastGraderMessage: null,
    updatedAt: now.toISOString(),
  };
}
