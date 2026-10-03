import type { MentorGraderEventResponse } from "@/lib/ai/mentor-contracts";
import { M3_MENTOR_LESSON_ID } from "@/lib/ai/mentor-contracts";

export type MentorGraderEventInput = {
  lessonId: typeof M3_MENTOR_LESSON_ID;
  blockIndex: number;
  learnerCode?: string;
  selectedOptionId?: string;
};

export async function postMentorGraderEvent(
  input: MentorGraderEventInput,
): Promise<MentorGraderEventResponse> {
  const response = await fetch("/api/ai/mentor/grader-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as MentorGraderEventResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not record check with mentor");
  }

  return payload;
}

/** Fire-and-forget grader sync — must not block or break local grader UX. */
export function syncMentorGraderEvent(
  input: MentorGraderEventInput,
  onSuccess?: (result: MentorGraderEventResponse) => void,
): void {
  void postMentorGraderEvent(input)
    .then((result) => onSuccess?.(result))
    .catch(() => {
      /* Mentor grader sync is best-effort; local grader remains authoritative for instant UX */
    });
}
