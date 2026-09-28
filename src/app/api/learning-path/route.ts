import { auth } from "@clerk/nextjs/server";

import {
  ensureActiveLearningPathForUser,
  getActiveLearningPathForUser,
  LearningPathPreconditionError,
} from "@/server/services/learning-path-service";

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export async function GET(): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const path = await getActiveLearningPathForUser(userId);

  if (!path) {
    return jsonResponse({ error: "Learning path not found" }, 404);
  }

  return jsonResponse(path, 200);
}

export async function POST(): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const path = await ensureActiveLearningPathForUser(userId);
    return jsonResponse(path, 200);
  } catch (error) {
    if (error instanceof LearningPathPreconditionError) {
      return jsonResponse({ error: error.message }, 400);
    }

    throw error;
  }
}
