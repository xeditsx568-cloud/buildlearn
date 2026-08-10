"use client";

import Link from "next/link";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";

export function QuizShellScreen() {
  const { markQuizSkipped, hydrated } = useOnboarding();

  if (!hydrated) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Optional placement quiz</h1>
        <p className="text-muted-foreground">
          Answer a few quick questions so we can tailor your starting point.
          You can skip this step if you are not sure.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-input bg-muted/30 p-6 text-sm text-muted-foreground">
        Full placement quiz content and scoring will arrive in a later task.
        For now, continue to your path preview or skip the quiz.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
          <Link href="/onboarding/path" onClick={() => markQuizSkipped()}>
            I&apos;m not sure — skip quiz
          </Link>
        </Button>
      </div>
    </section>
  );
}
