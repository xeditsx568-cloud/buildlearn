import { readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

const codeSnippetSchema = z.object({
  language: z.string().min(1),
  content: z.string(),
});

const objectiveBlockSchema = z.object({
  type: z.literal("objective"),
  title: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
});

const explainBlockSchema = z.object({
  type: z.literal("explain"),
  title: z.string().min(1).optional(),
  body: z.string().min(1),
  code: codeSnippetSchema.optional(),
});

const interactBlockSchema = z.object({
  type: z.literal("interact"),
  title: z.string().min(1).optional(),
  instructions: z.string().min(1),
  language: z.string().min(1).default("html"),
  starterCode: z.string(),
  hint: z.string().min(1).optional(),
});

const exerciseBlockSchema = z.object({
  type: z.literal("exercise"),
  title: z.string().min(1),
  instructions: z.string().min(1),
  language: z.string().min(1),
  starterCode: z.string(),
  solutionHint: z.string().min(1).optional(),
});

const quizOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

const quizBlockSchema = z
  .object({
    type: z.literal("quiz"),
    question: z.string().min(1),
    options: z.array(quizOptionSchema).min(2),
    correctOptionId: z.string().min(1),
    explanation: z.string().min(1).optional(),
  })
  .superRefine((quiz, ctx) => {
    const optionIds = new Set(quiz.options.map((option) => option.id));

    if (!optionIds.has(quiz.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionId must match one of the quiz option ids",
        path: ["correctOptionId"],
      });
    }
  });

const bridgeBlockSchema = z.object({
  type: z.literal("bridge"),
  body: z.string().min(1),
  nextLessonId: z.string().min(1).optional(),
  nextLessonTitle: z.string().min(1).optional(),
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  objectiveBlockSchema,
  explainBlockSchema,
  interactBlockSchema,
  exerciseBlockSchema,
  quizBlockSchema,
  bridgeBlockSchema,
]);

export const lessonContentSchema = z.object({
  conceptIds: z.array(z.string().min(1)).min(1),
  blocks: z.array(lessonBlockSchema).min(1),
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  estimatedMinutes: z.number().int().min(1),
  version: z.number().int().min(1),
  conceptIds: z.array(z.string().min(1)).min(1),
  blocks: z.array(lessonBlockSchema).min(1),
});

export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonRecord = z.infer<typeof lessonSchema>;

export const LESSON_BLOCK_TYPES = [
  "objective",
  "explain",
  "interact",
  "exercise",
  "quiz",
  "bridge",
] as const;

export type LessonBlockType = (typeof LESSON_BLOCK_TYPES)[number];

const CONTENT_DIR = join(process.cwd(), "content", "lessons");

export function parseLesson(raw: unknown): LessonRecord {
  return lessonSchema.parse(raw);
}

export function parseLessonContent(raw: unknown): LessonContent {
  return lessonContentSchema.parse(raw);
}

export function loadLessonFromFile(
  fileName: string,
  baseDir = CONTENT_DIR,
): LessonRecord {
  const filePath = join(baseDir, fileName);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  return parseLesson(raw);
}

export function toPersistedLessonContent(lesson: LessonRecord): LessonContent {
  return {
    conceptIds: lesson.conceptIds,
    blocks: lesson.blocks,
  };
}
