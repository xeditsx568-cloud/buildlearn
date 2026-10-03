import {
  MentorBlockIndexError,
  MentorQuotaExceededError,
  MentorRateLimitError,
  MentorServiceUnavailableError,
  MentorValidationError,
} from "@/server/services/mentor-errors";
import { MentorRequestTooLargeError } from "@/lib/ai/mentor-http";
import {
  LessonNotFoundError,
  PathStepLockedError,
} from "@/server/services/mentor-access-service";

export function jsonResponse(
  body: unknown,
  status: number,
  headers?: Record<string, string>,
): Response {
  return Response.json(body, { status, headers });
}

export function mentorErrorResponse(error: unknown): Response {
  if (error instanceof MentorRequestTooLargeError) {
    return jsonResponse({ error: error.message }, 413);
  }

  if (error instanceof MentorQuotaExceededError) {
    return jsonResponse(
      { error: error.message, code: "quota_exhausted" },
      429,
      {
        "Retry-After": String(error.retryAfterSeconds),
        "X-Mentor-Quota-Remaining": "0",
      },
    );
  }

  if (error instanceof MentorRateLimitError) {
    return jsonResponse(
      { error: error.message, code: "rate_limited" },
      429,
      { "Retry-After": String(error.retryAfterSeconds) },
    );
  }

  if (error instanceof MentorServiceUnavailableError) {
    return jsonResponse(
      { error: error.message, code: "service_unavailable" },
      503,
    );
  }

  if (error instanceof PathStepLockedError) {
    return jsonResponse({ error: error.message }, 403);
  }

  if (error instanceof LessonNotFoundError) {
    return jsonResponse({ error: error.message }, 404);
  }

  if (
    error instanceof MentorBlockIndexError ||
    error instanceof MentorValidationError
  ) {
    return jsonResponse({ error: error.message }, 400);
  }

  throw error;
}
