import { auth } from "@clerk/nextjs/server";

import {
  getLessonWithAccessForUser,
  LessonNotFoundError,
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
    const payload = await getLessonWithAccessForUser(userId, lessonId);
    return jsonResponse(payload, 200);
  } catch (error) {
    if (error instanceof LessonNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    if (error instanceof PathStepLockedError) {
      return jsonResponse({ error: error.message }, 403);
    }

    throw error;
  }
}
