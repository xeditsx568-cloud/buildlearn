import type { Lesson } from "@prisma/client";

import type { LessonPlayerPayload } from "@/lib/lesson-player/contracts";
import { parseLessonContent } from "@/lib/schemas/lesson";
import { db } from "@/server/db";

export class LessonNotFoundError extends Error {
  constructor(message = "Lesson not found") {
    super(message);
    this.name = "LessonNotFoundError";
  }
}

function toLessonPlayerPayload(row: Lesson): LessonPlayerPayload {
  const content = parseLessonContent(row.content);

  return {
    id: row.id,
    title: row.title,
    estimatedMinutes: row.estimatedMinutes,
    version: row.version,
    conceptIds: content.conceptIds,
    blocks: content.blocks,
  };
}

export async function getLessonPlayerPayload(
  lessonId: string,
): Promise<LessonPlayerPayload> {
  const row = await db.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!row) {
    throw new LessonNotFoundError();
  }

  return toLessonPlayerPayload(row);
}
