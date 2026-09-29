import { ONBOARDING_COMPLETION_ROUTE } from "@/lib/onboarding/constants";
import type { PathPreviewStatus } from "@/lib/onboarding/types";

export type PathPreviewStepItem = {
  orderIndex: number;
  displayTitle: string;
  stepType: string;
  status: string;
};

export function getPathStepTypeLabel(stepType: string): string {
  switch (stepType) {
    case "lesson":
      return "lesson";
    case "challenge":
      return "challenge";
    case "project_milestone":
      return "milestone";
    default:
      return stepType.replaceAll("_", " ");
  }
}

export function getStartLearningHref(): string {
  return ONBOARDING_COMPLETION_ROUTE;
}

interface PathPreviewViewProps {
  status: PathPreviewStatus;
  goalText: string;
  steps: PathPreviewStepItem[];
  onRetry?: () => void;
  onStartLearning?: () => void;
  startLearningDisabled?: boolean;
  startLearningLabel?: string;
  startLearningError?: string | null;
}

export function PathPreviewView({
  status,
  goalText,
  steps,
  onRetry,
  onStartLearning,
  startLearningDisabled = false,
  startLearningLabel = "Start learning →",
  startLearningError = null,
}: PathPreviewViewProps) {
  if (status === "loading") {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      >
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Your learning path</h1>
        </header>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
        <p className="text-muted-foreground">
          Generating your personalized path...
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes a few seconds.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        aria-live="assertive"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      >
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Your learning path</h1>
        </header>
        <p>We couldn&apos;t generate your path.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
          <a
            href="mailto:support@buildlearn.app"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Contact support
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your learning path</h1>
        <p className="text-muted-foreground">
          Goal: {goalText.trim() || "Your project"}
        </p>
        <p className="text-xs text-muted-foreground">
          Path generated from your goal and our curated skill graph (deterministic
          v1).
        </p>
      </header>

      <ol className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {steps.map((step) => (
          <li
            key={step.orderIndex}
            className="flex items-center justify-between gap-4 rounded-lg border border-input px-4 py-3"
          >
            <span>
              {step.status === "available" || step.orderIndex === 0 ? "✓" : "○"}{" "}
              {step.orderIndex + 1}. {step.displayTitle}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              [{getPathStepTypeLabel(step.stepType)}]
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-end gap-2">
        {startLearningError ? (
          <p role="alert" className="text-sm text-red-600">
            {startLearningError}
          </p>
        ) : null}
        {onStartLearning ? (
          <button
            type="button"
            onClick={onStartLearning}
            disabled={startLearningDisabled}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {startLearningLabel}
          </button>
        ) : (
          <a
            href={getStartLearningHref()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
          >
            {startLearningLabel}
          </a>
        )}
      </div>
    </section>
  );
}
