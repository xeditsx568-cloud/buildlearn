import type { LessonPlayerPayload } from "@/lib/lesson-player/contracts";
import { loadLessonFromFile } from "@/lib/schemas/lesson";

const lesson = loadLessonFromFile("01-how-websites-work.json");

export const L1_LESSON_PAYLOAD: LessonPlayerPayload = {
  id: lesson.id,
  title: lesson.title,
  estimatedMinutes: lesson.estimatedMinutes,
  version: lesson.version,
  conceptIds: lesson.conceptIds,
  blocks: lesson.blocks,
};
