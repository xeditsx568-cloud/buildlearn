import type {
  CompleteLessonResponse,
  LessonProgressRecord,
  PatchLessonProgressInput,
} from "@/lib/lesson-player/contracts";

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }

  return fallback;
}

export async function patchLessonProgress(
  lessonId: string,
  input: PatchLessonProgressInput,
): Promise<LessonProgressRecord> {
  const response = await fetch(`/api/lesson-progress/${lessonId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(errorMessage(body, "Could not save lesson progress"));
  }

  return body as LessonProgressRecord;
}

export async function completeLesson(
  lessonId: string,
  payload: { blocksCompleted: number[]; quizScore: number | null },
): Promise<CompleteLessonResponse> {
  const response = await fetch(`/api/lessons/${lessonId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(errorMessage(body, "Could not complete the lesson"));
  }

  return body as CompleteLessonResponse;
}
