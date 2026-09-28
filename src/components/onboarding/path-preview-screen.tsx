"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import {
  PathPreviewView,
  type PathPreviewStepItem,
} from "@/components/onboarding/path-preview-view";
import { generateLearningPath } from "@/lib/learning-path/learning-path-client";
import { patchProfileOnboarding } from "@/lib/onboarding/onboarding-client";
import {
  ONBOARDING_COMPLETION_ROUTE,
  PATH_LOADING_DELAY_MS,
} from "@/lib/onboarding/constants";
import type { PathPreviewStatus } from "@/lib/onboarding/types";

const SAVE_ERROR_MESSAGE =
  "We couldn't complete onboarding. Please try again.";

export function PathPreviewScreen() {
  const router = useRouter();
  const { goalText, hydrated } = useOnboarding();
  const [status, setStatus] = useState<PathPreviewStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PathPreviewStepItem[]>([]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setStatus("loading");
    setSteps([]);

    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const path = await generateLearningPath();
          if (cancelled) {
            return;
          }

          setSteps(
            path.steps.map((step) => ({
              orderIndex: step.orderIndex,
              displayTitle: step.displayTitle,
              stepType: step.stepType,
              status: step.status,
            })),
          );
          setStatus("loaded");
        } catch {
          if (!cancelled) {
            setStatus("error");
          }
        }
      })();
    }, PATH_LOADING_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hydrated, attempt]);

  async function handleStartLearning() {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await patchProfileOnboarding({
        onboardingComplete: true,
        onboardingStep: "path",
      });
      router.push(ONBOARDING_COMPLETION_ROUTE);
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
    <PathPreviewView
      status={status}
      goalText={goalText}
      steps={steps}
      onRetry={() => setAttempt((value) => value + 1)}
      onStartLearning={() => void handleStartLearning()}
      startLearningDisabled={saving || status !== "loaded"}
      startLearningLabel={saving ? "Saving..." : "Start learning →"}
      startLearningError={saveError}
    />
  );
}

/** Test helper to render path preview in a fixed state without timers. */
export function PathPreviewScreenStatic({
  status,
  goalText = "A portfolio site for my photography business",
  steps = [],
}: {
  status: PathPreviewStatus;
  goalText?: string;
  steps?: PathPreviewStepItem[];
}) {
  return (
    <PathPreviewView
      status={status}
      goalText={goalText}
      steps={steps}
      onRetry={() => undefined}
      onStartLearning={() => undefined}
    />
  );
}
