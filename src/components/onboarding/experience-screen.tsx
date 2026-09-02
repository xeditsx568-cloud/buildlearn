"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { patchProfileOnboarding } from "@/lib/onboarding/onboarding-client";
import { EXPERIENCE_OPTIONS } from "@/lib/onboarding/constants";
import type { ExperienceLevel } from "@/lib/onboarding/types";
import { isExperienceSelected } from "@/lib/onboarding/validation";

const SAVE_ERROR_MESSAGE =
  "We couldn't save your experience level. Please try again.";

export function ExperienceScreen() {
  const router = useRouter();
  const { experienceLevel, setExperienceLevel, hydrated } = useOnboarding();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = isExperienceSelected(experienceLevel);

  async function handleContinue() {
    if (!canContinue || !experienceLevel || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await patchProfileOnboarding({
        experienceLevel,
        onboardingStep: "quiz",
      });
      router.push("/onboarding/quiz");
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
    } finally {
      setSaving(false);
    }
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
                onChange={() => {
                  setExperienceLevel(option.value as ExperienceLevel);
                  setSaveError(null);
                }}
                disabled={saving}
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

      {saveError ? (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={!canContinue || saving}
          onClick={() => void handleContinue()}
        >
          {saving ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </section>
  );
}
