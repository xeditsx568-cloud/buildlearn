"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OnboardingBackLink } from "@/components/onboarding/onboarding-back-link";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import type { OnboardingStepId } from "@/lib/onboarding/constants";

function getStepFromPathname(pathname: string): OnboardingStepId {
  if (pathname.startsWith("/onboarding/experience")) {
    return "experience";
  }

  if (pathname.startsWith("/onboarding/quiz")) {
    return "quiz";
  }

  if (pathname.startsWith("/onboarding/path")) {
    return "path";
  }

  return "goal";
}

export function OnboardingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentStep = getStepFromPathname(pathname);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <OnboardingStepper currentStep={currentStep} />
      <div className="mb-6">
        <OnboardingBackLink currentStep={currentStep} />
      </div>
      {children}
    </div>
  );
}
