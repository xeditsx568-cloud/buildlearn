import { describe, expect, it } from "vitest";

import {
  getPlacementQuestionIds,
  getPlacementQuizQuestions,
  PLACEMENT_QUIZ_QUESTION_COUNT,
} from "@/lib/onboarding/placement-quiz";
import { PLACEMENT_QUIZ_QUESTIONS } from "@/lib/onboarding/placement-quiz-questions";

describe("placement quiz questions", () => {
  it("contains exactly 5 curated questions", () => {
    expect(PLACEMENT_QUIZ_QUESTION_COUNT).toBe(5);
    expect(getPlacementQuizQuestions()).toHaveLength(5);
    expect(PLACEMENT_QUIZ_QUESTIONS).toHaveLength(5);
  });

  it("uses deterministic unique question IDs", () => {
    const ids = getPlacementQuestionIds();

    expect(ids).toEqual([
      "placement-q1-html-structure",
      "placement-q2-html-links",
      "placement-q3-css-color",
      "placement-q4-css-flexbox",
      "placement-q5-js-variables",
    ]);
    expect(new Set(ids).size).toBe(5);
  });

  it("covers beginner HTML, CSS, and JavaScript domains", () => {
    const domains = getPlacementQuizQuestions().map((question) => question.domain);

    expect(domains).toContain("html");
    expect(domains).toContain("css");
    expect(domains).toContain("javascript");
  });

  it("defines multiple-choice options with one correct answer each", () => {
    for (const question of getPlacementQuizQuestions()) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(
        question.options.some(
          (option) => option.id === question.correctOptionId,
        ),
      ).toBe(true);
      expect(new Set(question.options.map((option) => option.id)).size).toBe(
        question.options.length,
      );
    }
  });
});
