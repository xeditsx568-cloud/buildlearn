import type { MentorGraderEventResponse } from "@/lib/ai/mentor-contracts";
import { M3_MENTOR_LESSON_ID } from "@/lib/ai/mentor-contracts";
import {
  isSameMentorBlockScope,
  type MentorBlockScope,
} from "@/lib/lesson-player/mentor-block-scope";

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

export type SyncMentorGraderEventOptions = {
  /** When provided, success callback runs only if scope still matches (B-W2-02). */
  getActiveScope?: () => MentorBlockScope;
};

/** Fire-and-forget grader sync — must not block or break local grader UX. */
export function syncMentorGraderEvent(
  input: MentorGraderEventInput,
  onSuccess?: (result: MentorGraderEventResponse) => void,
  options?: SyncMentorGraderEventOptions,
): void {
  const requestScope: MentorBlockScope = {
    lessonId: input.lessonId,
    blockIndex: input.blockIndex,
  };

  void postMentorGraderEvent(input)
    .then((result) => {
      if (
        options?.getActiveScope &&
        !isSameMentorBlockScope(requestScope, options.getActiveScope())
      ) {
        return;
      }
      onSuccess?.(result);
    })
    .catch(() => {
      /* Mentor grader sync is best-effort; local grader remains authoritative for instant UX */
    });
}
