export type ExperienceLevel = "beginner" | "some_exposure" | "intermediate";

export type PathStepType = "lesson" | "challenge" | "milestone";

export interface OnboardingState {
  goalText: string;
  experienceLevel: ExperienceLevel | null;
  quizSkipped: boolean;
}

export interface MockPathStep {
  order: number;
  title: string;
  type: PathStepType;
}

export type PathPreviewStatus = "loading" | "error" | "loaded";
