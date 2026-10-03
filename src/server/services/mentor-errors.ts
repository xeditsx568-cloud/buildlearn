export class MentorServiceUnavailableError extends Error {
  constructor(message = "Mentor service temporarily unavailable") {
    super(message);
    this.name = "MentorServiceUnavailableError";
  }
}

export class MentorQuotaExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(
    message = "Monthly mentor quota exceeded",
    retryAfterSeconds = 3600,
  ) {
    super(message);
    this.name = "MentorQuotaExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class MentorRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(
    message = "Too many mentor requests",
    retryAfterSeconds = 60,
  ) {
    super(message);
    this.name = "MentorRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class MentorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MentorValidationError";
  }
}

export class MentorBlockIndexError extends Error {
  constructor(message = "Invalid block index") {
    super(message);
    this.name = "MentorBlockIndexError";
  }
}
