import {
  MENTOR_MAX_REQUEST_BODY_BYTES,
  mentorGraderEventRequestSchema,
  mentorHelpRequestSchema,
} from "@/lib/ai/mentor-contracts";
import { MentorValidationError } from "@/server/services/mentor-errors";

export class MentorRequestTooLargeError extends Error {
  constructor() {
    super("Request body too large");
    this.name = "MentorRequestTooLargeError";
  }
}

export async function readMentorJsonBody(
  request: Request,
): Promise<unknown> {
  const raw = await request.text();
  const byteLength = new TextEncoder().encode(raw).length;
  if (byteLength > MENTOR_MAX_REQUEST_BODY_BYTES) {
    throw new MentorRequestTooLargeError();
  }
  if (!raw.trim()) {
    return {};
  }
  return JSON.parse(raw) as unknown;
}

export function parseMentorHelpBody(payload: unknown) {
  const result = mentorHelpRequestSchema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    throw new MentorValidationError(message || "Invalid request body");
  }
  return result.data;
}

export function parseMentorGraderEventBody(payload: unknown) {
  const result = mentorGraderEventRequestSchema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    throw new MentorValidationError(message || "Invalid request body");
  }
  return result.data;
}
