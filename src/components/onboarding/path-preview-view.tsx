import {
  MOCK_PATH_STEPS,
  ONBOARDING_COMPLETION_ROUTE,
} from "@/lib/onboarding/constants";
import type { MockPathStep, PathPreviewStatus } from "@/lib/onboarding/types";

export function getPathStepTypeLabel(type: MockPathStep["type"]): string {
  switch (type) {
    case "lesson":
      return "lesson";
    case "challenge":
      return "challenge";
    case "milestone":
      return "milestone";
  }
}

export function getStartLearningHref(): string {
  return ONBOARDING_COMPLETION_ROUTE;
}

interface PathPreviewViewProps {
  status: PathPreviewStatus;
  goalText: string;
  onRetry?: () => void;
}

export function PathPreviewView({
  status,
  goalText,
  onRetry,
}: PathPreviewViewProps) {
  if (status === "loading") {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      >
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Your path</h1>
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
          This usually takes 10–20 seconds.
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
          <h1 className="text-2xl font-semibold">Your path</h1>
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
          Preview uses stub data — real path generation arrives in a later phase.
        </p>
      </header>

      <ol className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {MOCK_PATH_STEPS.map((step) => (
          <li
            key={step.order}
            className="flex items-center justify-between gap-4 rounded-lg border border-input px-4 py-3"
          >
            <span>
              {step.order === 1 ? "✓" : "○"} {step.order}. {step.title}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              [{getPathStepTypeLabel(step.type)}]
            </span>
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <a
          href={getStartLearningHref()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
        >
          Start learning →
        </a>
      </div>
    </section>
  );
}
