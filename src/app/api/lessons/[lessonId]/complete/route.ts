import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import {
  completeLessonForUser,
  LessonCompletePreconditionError,
  LessonNotFoundError,
  LessonProgressValidationError,
  PathStepLockedError,
  PathStepNotFoundError,
} from "@/server/services/lesson-progress-service";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

const completeLessonBodySchema = z
  .object({
    blocksCompleted: z.array(z.number().int().min(0)),
    quizScore: z.number().min(0).max(1).nullable(),
  })
  .strict();

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { lessonId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = completeLessonBodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  try {
    const result = await completeLessonForUser(userId, lessonId, parsed.data);
    return jsonResponse(result, 200);
  } catch (error) {
    if (error instanceof LessonNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    if (
      error instanceof PathStepLockedError ||
      error instanceof PathStepNotFoundError
    ) {
      return jsonResponse({ error: (error as Error).message }, 403);
    }

    if (error instanceof LessonCompletePreconditionError) {
      return jsonResponse({ error: error.message }, 400);
    }

    if (error instanceof LessonProgressValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    throw error;
  }
}
