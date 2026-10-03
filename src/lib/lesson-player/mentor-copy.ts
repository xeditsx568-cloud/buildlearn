import type { MentorHelpAction } from "@/lib/ai/mentor-contracts";

/** Beginner-friendly action labels (not internal level names). */
export const MENTOR_ACTION_LABELS: Record<MentorHelpAction, string> = {
  get_help: "Get help with this step",
  explain_task: "What is this asking me to do?",
  explain_last_check: "Explain my last check",
  need_more_help: "I need more help",
};

export const MENTOR_PANEL_TITLE = "BuildLearn help";
export const MENTOR_PANEL_INTRO =
  "Stuck on this step? Ask for a plain-language explanation. We teach—you still write the code.";

export function mentorQuotaExhaustedCopy(): string {
  return "You have used your AI help allowance for this month. You can still use the hints on this page and keep trying.";
}

export function mentorRateLimitedCopy(retryAfterSeconds?: number): string {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return `Please wait a moment before asking again (${retryAfterSeconds}s).`;
  }
  return "Please wait a moment before asking again.";
}

export function mentorUnavailableCopy(): string {
  return "Live AI help is resting right now. Use the hint on this page and try a small change, then check your work again.";
}

export function mentorNetworkErrorCopy(): string {
  return "We could not reach help just now. Check your connection and try again.";
}
