import { auth } from "@clerk/nextjs/server";

import {
  getLessonProgressForUser,
  LessonNotFoundError,
  LessonProgressNotFoundError,
  LessonProgressValidationError,
  parsePatchLessonProgressInput,
  patchLessonProgressForUser,
  PathStepLockedError,
} from "@/server/services/lesson-progress-service";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { lessonId } = await context.params;

  try {
    const progress = await getLessonProgressForUser(userId, lessonId);
    return jsonResponse(progress, 200);
  } catch (error) {
    if (error instanceof LessonProgressNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    throw error;
  }
}

export async function PATCH(
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

  try {
    const input = parsePatchLessonProgressInput(payload);
    const progress = await patchLessonProgressForUser(userId, lessonId, input);
    return jsonResponse(progress, 200);
  } catch (error) {
    if (error instanceof LessonProgressValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    if (error instanceof LessonNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    if (error instanceof PathStepLockedError) {
      return jsonResponse({ error: error.message }, 403);
    }

    throw error;
  }
}
