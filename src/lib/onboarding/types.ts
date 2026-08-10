export type ExperienceLevel = "beginner" | "some_exposure" | "intermediate";

export type PathStepType = "lesson" | "challenge" | "milestone";

export type PlacementDomain = "html" | "css" | "javascript";

export interface PlacementQuizOption {
  id: string;
  label: string;
}

export interface PlacementQuizQuestion {
  id: string;
  prompt: string;
  options: PlacementQuizOption[];
  correctOptionId: string;
  domain: PlacementDomain;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface PlacementDomainSummary {
  domain: PlacementDomain;
  correct: number;
  total: number;
}

export interface PlacementResult {
  totalCorrect: number;
  totalQuestions: number;
  percentage: number;
  domainSummary: PlacementDomainSummary[];
}

export interface OnboardingState {
  goalText: string;
  experienceLevel: ExperienceLevel | null;
  quizSkipped: boolean;
  quizCompleted: boolean;
  quizAnswers: QuizAnswer[];
  placementResult: PlacementResult | null;
}

export interface MockPathStep {
  order: number;
  title: string;
  type: PathStepType;
}

export type PathPreviewStatus = "loading" | "error" | "loaded";
