import type {
  MentorHelpRequest,
  MentorHelpResponse,
} from "@/lib/ai/mentor-contracts";

export type MentorHelpSource = "ai" | "fallback";

export type MentorQuotaResponse = {
  remainingThisMonth: number;
  limitThisMonth: number;
  resetAt: string;
};

export class MentorApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = "MentorApiError";
    this.status = status;
    this.code = options?.code;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) {
    return undefined;
  }
  const parsed = Number.parseInt(header, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchMentorQuota(): Promise<MentorQuotaResponse> {
  const response = await fetch("/api/ai/mentor/quota");
  const payload = (await response.json()) as MentorQuotaResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new MentorApiError(
      payload.error ?? "Could not load mentor quota",
      response.status,
    );
  }

  return payload;
}

export async function postMentorHelp(
  body: MentorHelpRequest,
): Promise<{ data: MentorHelpResponse; source: MentorHelpSource }> {
  const response = await fetch("/api/ai/mentor/help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as MentorHelpResponse & {
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new MentorApiError(
      payload.error ?? "Could not get help right now",
      response.status,
      {
        code: payload.code,
        retryAfterSeconds: parseRetryAfter(response),
      },
    );
  }

  const source: MentorHelpSource =
    response.headers.get("X-Mentor-Response-Source") === "fallback"
      ? "fallback"
      : "ai";

  return { data: payload, source };
}
