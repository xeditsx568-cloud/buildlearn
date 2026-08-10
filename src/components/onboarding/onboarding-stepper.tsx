"use client";

import { ONBOARDING_STEPS } from "@/lib/onboarding/constants";
import type { OnboardingStepId } from "@/lib/onboarding/constants";

interface OnboardingStepperProps {
  currentStep: OnboardingStepId;
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const currentIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStep,
  );

  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`inline-flex size-3 rounded-full ${
                  isComplete || isCurrent ? "bg-primary" : "bg-muted"
                }`}
                title={step.label}
              />
              {index < ONBOARDING_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-6 sm:w-10 ${
                    isComplete ? "bg-primary" : "bg-muted"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        Step {currentIndex + 1} of {ONBOARDING_STEPS.length} —{" "}
        {ONBOARDING_STEPS[currentIndex]?.label}
      </p>
    </nav>
  );
}
