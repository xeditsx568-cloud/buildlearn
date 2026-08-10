"use client";

import { useEffect, useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { PathPreviewView } from "@/components/onboarding/path-preview-view";
import { PATH_LOADING_DELAY_MS } from "@/lib/onboarding/constants";
import type { PathPreviewStatus } from "@/lib/onboarding/types";

export function PathPreviewScreen() {
  const { goalText, hydrated } = useOnboarding();
  const [status, setStatus] = useState<PathPreviewStatus>("loading");
  const [attempt, setAttempt] = useState(0);

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

  if (!hydrated) {
    return null;
  }

  return (
    <PathPreviewView
      status={status}
      goalText={goalText}
      onRetry={() => setAttempt((value) => value + 1)}
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
