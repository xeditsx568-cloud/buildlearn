import { LessonProgressStatus } from "@prisma/client";

import { db } from "@/server/db";
import { assertLessonStepOpenable } from "@/server/services/learning-path-step-service";
import { getLessonPlayerPayload } from "@/server/services/lesson-service";

/** Server-only hints_used increment after billable mentor help (§5, DoD #8). */
export async function incrementHintsUsedForMentorHelp(
  userId: string,
  lessonId: string,
): Promise<number> {
  await getLessonPlayerPayload(lessonId);
  await assertLessonStepOpenable(userId, lessonId);

  const row = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      status: LessonProgressStatus.started,
      blocksCompleted: [],
      hintsUsed: 1,
    },
    update: {
      hintsUsed: { increment: 1 },
    },
  });

  return row.hintsUsed;
}
