"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { PathPreviewView } from "@/components/onboarding/path-preview-view";
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

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setStatus("loading");

    const timer = window.setTimeout(() => {
      setStatus("loaded");
    }, PATH_LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
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
      onRetry={() => setAttempt((value) => value + 1)}
      onStartLearning={() => void handleStartLearning()}
      startLearningDisabled={saving}
      startLearningLabel={saving ? "Saving..." : "Start learning →"}
      startLearningError={saveError}
    />
  );
}

/** Test helper to render path preview in a fixed state without timers. */
export function PathPreviewScreenStatic({
  status,
  goalText = "A portfolio site for my photography business",
}: {
  status: PathPreviewStatus;
  goalText?: string;
}) {
  return (
    <PathPreviewView
      status={status}
      goalText={goalText}
      onRetry={() => undefined}
    />
  );
}
