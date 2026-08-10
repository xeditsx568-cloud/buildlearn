"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding/constants";
import { scorePlacementQuiz } from "@/lib/onboarding/placement-scoring";
import { getPlacementQuizQuestions } from "@/lib/onboarding/placement-quiz";
import type {
  ExperienceLevel,
  OnboardingState,
  QuizAnswer,
} from "@/lib/onboarding/types";

const defaultState: OnboardingState = {
  goalText: "",
  experienceLevel: null,
  quizSkipped: false,
  quizCompleted: false,
  quizAnswers: [],
  placementResult: null,
};

interface OnboardingContextValue extends OnboardingState {
  hydrated: boolean;
  setGoalText: (goalText: string) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  markQuizSkipped: () => void;
  completeQuiz: (answers: QuizAnswer[]) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function normalizeOnboardingState(
  parsed: Partial<OnboardingState>,
): OnboardingState {
  return {
    goalText: parsed.goalText ?? "",
    experienceLevel: parsed.experienceLevel ?? null,
    quizSkipped: parsed.quizSkipped ?? false,
    quizCompleted: parsed.quizCompleted ?? false,
    quizAnswers: Array.isArray(parsed.quizAnswers) ? parsed.quizAnswers : [],
    placementResult: parsed.placementResult ?? null,
  };
}

/** @internal Exported for unit tests — normalizes legacy sessionStorage payloads. */
export function normalizeStoredOnboardingState(
  parsed: Partial<OnboardingState>,
): OnboardingState {
  return normalizeOnboardingState(parsed);
}

function readStoredState(): OnboardingState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return normalizeOnboardingState(parsed);
  } catch {
    return defaultState;
  }
}

function writeStoredState(state: OnboardingState): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStoredState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeStoredState(state);
  }, [state, hydrated]);

  const setGoalText = useCallback((goalText: string) => {
    setState((current) => ({ ...current, goalText }));
  }, []);

  const setExperienceLevel = useCallback((experienceLevel: ExperienceLevel) => {
    setState((current) => ({ ...current, experienceLevel }));
  }, []);

  const markQuizSkipped = useCallback(() => {
    setState((current) => ({
      ...current,
      quizSkipped: true,
      quizCompleted: false,
      quizAnswers: [],
      placementResult: null,
    }));
  }, []);

  const completeQuiz = useCallback((answers: QuizAnswer[]) => {
    const placementResult = scorePlacementQuiz(
      getPlacementQuizQuestions(),
      answers,
    );

    setState((current) => ({
      ...current,
      quizSkipped: false,
      quizCompleted: true,
      quizAnswers: answers,
      placementResult,
    }));
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      ...state,
      hydrated,
      setGoalText,
      setExperienceLevel,
      markQuizSkipped,
      completeQuiz,
    }),
    [
      state,
      hydrated,
      setGoalText,
      setExperienceLevel,
      markQuizSkipped,
      completeQuiz,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return context;
}
