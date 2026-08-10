"use client";

import { useRouter } from "next/navigation";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { EXPERIENCE_OPTIONS } from "@/lib/onboarding/constants";
import type { ExperienceLevel } from "@/lib/onboarding/types";
import { isExperienceSelected } from "@/lib/onboarding/validation";

export function ExperienceScreen() {
  const router = useRouter();
  const { experienceLevel, setExperienceLevel, hydrated } = useOnboarding();

  const canContinue = isExperienceSelected(experienceLevel);

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    router.push("/onboarding/quiz");
  }

  if (!hydrated) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">How much coding have you done?</h1>
        <p className="text-muted-foreground">
          Choose the option that best describes your experience.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Experience level"
        className="flex flex-col gap-4"
      >
        {EXPERIENCE_OPTIONS.map((option) => {
          const selected = experienceLevel === option.value;

          return (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                selected ? "border-primary bg-muted/40" : "border-input"
              }`}
            >
              <input
                type="radio"
                name="experience-level"
                value={option.value}
                checked={selected}
                onChange={() =>
                  setExperienceLevel(option.value as ExperienceLevel)
                }
                className="mt-1 size-4 accent-primary"
              />
              <span className="space-y-1">
                <span className="block font-medium">{option.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
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
