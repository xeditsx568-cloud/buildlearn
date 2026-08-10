import { PLACEMENT_QUIZ_QUESTIONS } from "@/lib/onboarding/placement-quiz-questions";
import type { PlacementQuizQuestion } from "@/lib/onboarding/types";

export const PLACEMENT_QUIZ_QUESTION_COUNT = PLACEMENT_QUIZ_QUESTIONS.length;

export function getPlacementQuizQuestions(): PlacementQuizQuestion[] {
  return PLACEMENT_QUIZ_QUESTIONS;
}

export function getPlacementQuestionIds(): string[] {
  return PLACEMENT_QUIZ_QUESTIONS.map((question) => question.id);
}
