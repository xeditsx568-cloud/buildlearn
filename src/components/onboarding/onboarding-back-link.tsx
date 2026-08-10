"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/lib/onboarding/constants";
import type { OnboardingStepId } from "@/lib/onboarding/constants";

interface OnboardingBackLinkProps {
  currentStep: OnboardingStepId;
}

export function OnboardingBackLink({ currentStep }: OnboardingBackLinkProps) {
  const currentIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStep,
  );
  const previousStep = ONBOARDING_STEPS[currentIndex - 1];

  if (!previousStep) {
    return <div className="h-10" aria-hidden="true" />;
  }

  return (
    <Button asChild variant="outline" size="sm" className="min-h-11">
      <Link href={previousStep.path}>← Back</Link>
    </Button>
  );
}
