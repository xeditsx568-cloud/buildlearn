import type { LearningPathResponse } from "@/server/services/learning-path-service";

export class LearningPathClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LearningPathClientError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Request failed";
  } catch {
    return "Request failed";
  }
}

export async function generateLearningPath(): Promise<LearningPathResponse> {
  const response = await fetch("/api/learning-path", {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new LearningPathClientError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as LearningPathResponse;
}

export async function fetchLearningPath(): Promise<LearningPathResponse> {
  const response = await fetch("/api/learning-path", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new LearningPathClientError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as LearningPathResponse;
}
