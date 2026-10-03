import { auth } from "@clerk/nextjs/server";

import { runMentorHelp } from "@/ai/mentor/orchestrator";
import {
  parseMentorHelpBody,
  readMentorJsonBody,
} from "@/lib/ai/mentor-http";
import {
  jsonResponse,
  mentorErrorResponse,
} from "@/lib/ai/mentor-route-response";
import { db } from "@/server/db";
import {
  assertMentorLessonAccess,
  getLessonBlockAtIndex,
} from "@/server/services/mentor-access-service";
import { MentorBlockIndexError } from "@/server/services/mentor-errors";

const MENTOR_HELP_BLOCK_TYPES = new Set([
  "interact",
  "exercise",
  "quiz",
  "explain",
]);

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const raw = await readMentorJsonBody(request);
    const body = parseMentorHelpBody(raw);
    const lesson = await assertMentorLessonAccess(userId, body.lessonId);
    const block = getLessonBlockAtIndex(lesson, body.blockIndex);

    if (!MENTOR_HELP_BLOCK_TYPES.has(block.type)) {
      throw new MentorBlockIndexError(
        "Mentor help is not available for this block type",
      );
    }

    const profile = await db.profile.findUnique({ where: { userId } });

    const result = await runMentorHelp({
      userId,
      lesson,
      request: body,
      experienceLevel: profile?.experienceLevel ?? null,
      learningGoalText: profile?.learningGoalText ?? null,
    });

    const { responseSource, ...payload } = result;

    return jsonResponse(payload, 200, {
      "X-Mentor-Quota-Remaining": String(payload.quota.remainingThisMonth),
      "X-Mentor-Response-Source": responseSource,
    });
  } catch (error) {
    return mentorErrorResponse(error);
  }
}
