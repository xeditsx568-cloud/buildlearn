import Link from "next/link";
import type { ReactNode } from "react";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen px-6 py-6">
        <header className="mx-auto mb-8 flex w-full max-w-2xl items-center">
          <Link href="/" className="text-lg font-semibold">
            BuildLearn
          </Link>
        </header>
        <OnboardingShell>{children}</OnboardingShell>
      </div>
    </OnboardingProvider>
  );
}
