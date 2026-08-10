import { describe, expect, it } from "vitest";

import { getPlacementQuizQuestions } from "@/lib/onboarding/placement-quiz";
import { scorePlacementQuiz } from "@/lib/onboarding/placement-scoring";
import type { QuizAnswer } from "@/lib/onboarding/types";

const questions = getPlacementQuizQuestions();

function answersForOptionIds(
  optionIds: (string | null)[],
): QuizAnswer[] {
  return questions.flatMap((question, index) => {
    const selectedOptionId = optionIds[index];

    if (!selectedOptionId) {
      return [];
    }

    return [
      {
        questionId: question.id,
        selectedOptionId,
      },
    ];
  });
}

describe("placement scoring", () => {
  it("scores zero correct answers", () => {
    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId:
        question.options.find((option) => option.id !== question.correctOptionId)
          ?.id ?? question.options[0].id,
    }));

    const result = scorePlacementQuiz(questions, answers);

    expect(result.totalCorrect).toBe(0);
    expect(result.totalQuestions).toBe(5);
    expect(result.percentage).toBe(0);
  });

  it("scores some correct answers", () => {
    const answers = questions.map((question, index) => ({
      questionId: question.id,
      selectedOptionId:
        index % 2 === 0
          ? question.correctOptionId
          : (question.options.find(
              (option) => option.id !== question.correctOptionId,
            )?.id ?? question.options[0].id),
    }));

    const result = scorePlacementQuiz(questions, answers);

    expect(result.totalCorrect).toBe(3);
    expect(result.totalQuestions).toBe(5);
    expect(result.percentage).toBe(60);
  });

  it("scores all correct answers", () => {
    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: question.correctOptionId,
    }));

    const result = scorePlacementQuiz(questions, answers);

    expect(result.totalCorrect).toBe(5);
    expect(result.totalQuestions).toBe(5);
    expect(result.percentage).toBe(100);
  });

  it("calculates percentage with rounding", () => {
    const answers = answersForOptionIds([
      questions[0].correctOptionId,
      questions[1].correctOptionId,
      null,
      null,
      null,
    ]);

    const result = scorePlacementQuiz(questions, answers);

    expect(result.totalCorrect).toBe(2);
    expect(result.totalQuestions).toBe(5);
    expect(result.percentage).toBe(40);
  });

  it("returns a lightweight domain summary", () => {
    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: question.correctOptionId,
    }));

    const result = scorePlacementQuiz(questions, answers);

    expect(result.domainSummary).toEqual([
      { domain: "html", correct: 2, total: 2 },
      { domain: "css", correct: 2, total: 2 },
      { domain: "javascript", correct: 1, total: 1 },
    ]);
  });

  it("handles empty question and answer sets", () => {
    const result = scorePlacementQuiz([], []);

    expect(result.totalCorrect).toBe(0);
    expect(result.totalQuestions).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.domainSummary).toEqual([]);
  });
});
