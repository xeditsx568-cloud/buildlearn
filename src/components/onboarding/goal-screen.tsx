"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import {
  EXAMPLE_GOAL_CHIPS,
  GOAL_MAX_LENGTH,
} from "@/lib/onboarding/constants";
import { validateGoalText } from "@/lib/onboarding/validation";

export function GoalScreen() {
  const router = useRouter();
  const { goalText, setGoalText, hydrated } = useOnboarding();
  const [showError, setShowError] = useState(false);

  const validation = validateGoalText(goalText);
  const canContinue = validation.valid;

  function handleContinue() {
    if (!canContinue) {
      setShowError(true);
      return;
    }

    router.push("/onboarding/experience");
  }

  function handleChipClick(chip: string) {
    setGoalText(chip);
    setShowError(false);
  }

  if (!hydrated) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">What do you want to build?</h1>
        <p className="text-muted-foreground">
          Describe your project in your own words.
        </p>
      </header>

      <div className="space-y-2">
        <label htmlFor="goal-text" className="sr-only">
          Project goal
        </label>
        <textarea
          id="goal-text"
          value={goalText}
          onChange={(event) => {
            setGoalText(event.target.value);
            setShowError(false);
          }}
          maxLength={GOAL_MAX_LENGTH}
          rows={5}
          placeholder="I want to create a website for my..."
          className="min-h-[140px] w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-4 text-sm">
          <p
            role={showError && !validation.valid ? "alert" : undefined}
            className={
              showError && !validation.valid
                ? "text-red-600"
                : "text-muted-foreground"
            }
          >
            {showError && !validation.valid
              ? validation.error
              : "\u00a0"}
          </p>
          <p className="text-muted-foreground">
            {goalText.length} / {GOAL_MAX_LENGTH}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Example goals">
        {EXAMPLE_GOAL_CHIPS.map((chip) => (
          <Button
            key={chip}
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => handleChipClick(chip)}
          >
            {chip}
          </Button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue →
        </Button>
      </div>
    </section>
  );
}
