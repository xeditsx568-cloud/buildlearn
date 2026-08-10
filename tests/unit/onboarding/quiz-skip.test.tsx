import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { normalizeStoredOnboardingState } from "@/components/onboarding/onboarding-provider";
import {
  QuizShellScreenStatic,
} from "@/components/onboarding/quiz-shell-screen";
import { getPlacementQuizQuestions } from "@/lib/onboarding/placement-quiz";
import { scorePlacementQuiz } from "@/lib/onboarding/placement-scoring";

const mockPush = vi.fn();
const mockMarkQuizSkipped = vi.fn();
const mockCompleteQuiz = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/components/onboarding/onboarding-provider", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/onboarding/onboarding-provider")
  >("@/components/onboarding/onboarding-provider");

  return {
    ...actual,
    useOnboarding: () => ({
      hydrated: true,
      goalText: "A portfolio site",
      experienceLevel: "beginner",
      quizSkipped: false,
      quizCompleted: false,
      quizAnswers: [],
      placementResult: null,
      setGoalText: vi.fn(),
      setExperienceLevel: vi.fn(),
      markQuizSkipped: mockMarkQuizSkipped,
      completeQuiz: mockCompleteQuiz,
    }),
  };
});

describe("placement quiz UI", () => {
  it("renders one question at a time", () => {
    const html = renderToStaticMarkup(
      <QuizShellScreenStatic currentQuestionIndex={0} />,
    );

    expect(html).toContain("Question 1 of 5");
    expect(html).toContain("What is the main purpose of HTML on a web page?");
    expect(html).not.toContain("Which HTML element creates a clickable link");
  });

  it("disables Next when no answer is selected", () => {
    const html = renderToStaticMarkup(
      <QuizShellScreenStatic currentQuestionIndex={0} nextDisabled={true} />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Next →");
  });

  it("enables Next when an answer is selected", () => {
    const html = renderToStaticMarkup(
      <QuizShellScreenStatic
        currentQuestionIndex={0}
        selectedOptionId="placement-q1-a"
        nextDisabled={false}
      />,
    );

    expect(html).not.toContain('disabled=""');
    expect(html).toContain('value="placement-q1-a"');
    expect(html).toContain("checked");
  });

  it("reflects quiz progress in the indicator", () => {
    const firstQuestion = renderToStaticMarkup(
      <QuizShellScreenStatic currentQuestionIndex={0} />,
    );
    const thirdQuestion = renderToStaticMarkup(
      <QuizShellScreenStatic currentQuestionIndex={2} />,
    );

    expect(firstQuestion).toContain("Question 1 of 5");
    expect(thirdQuestion).toContain("Question 3 of 5");
    expect(thirdQuestion).toContain("Which CSS property changes the color of text?");
  });

  it("shows Complete quiz on the final question", () => {
    const html = renderToStaticMarkup(
      <QuizShellScreenStatic
        currentQuestionIndex={4}
        selectedOptionId="placement-q5-a"
        nextDisabled={false}
        nextLabel="Complete quiz →"
      />,
    );

    expect(html).toContain("Question 5 of 5");
    expect(html).toContain("Complete quiz →");
  });

  it("provides skip action copy", () => {
    const html = renderToStaticMarkup(
      <QuizShellScreenStatic currentQuestionIndex={0} />,
    );

    expect(html).toContain("I&#x27;m not sure — skip quiz");
    expect(html).toContain("Optional placement quiz");
  });
});

describe("quiz skip and completion behavior", () => {
  it("marks quiz skipped and clears quiz results when skipping", () => {
    const skipped = normalizeStoredOnboardingState({
      goalText: "A blog",
      experienceLevel: "beginner",
      quizSkipped: true,
      quizCompleted: false,
      quizAnswers: [],
      placementResult: null,
    });

    expect(skipped.quizSkipped).toBe(true);
    expect(skipped.quizCompleted).toBe(false);
    expect(skipped.quizAnswers).toEqual([]);
    expect(skipped.placementResult).toBeNull();
  });

  it("stores deterministic placement result when quiz is completed", () => {
    const questions = getPlacementQuizQuestions();
    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: question.correctOptionId,
    }));
    const placementResult = scorePlacementQuiz(questions, answers);

    const completed = normalizeStoredOnboardingState({
      goalText: "A blog",
      experienceLevel: "beginner",
      quizSkipped: false,
      quizCompleted: true,
      quizAnswers: answers,
      placementResult,
    });

    expect(completed.quizSkipped).toBe(false);
    expect(completed.quizCompleted).toBe(true);
    expect(completed.quizAnswers).toHaveLength(5);
    expect(completed.placementResult).toEqual({
      totalCorrect: 5,
      totalQuestions: 5,
      percentage: 100,
      domainSummary: [
        { domain: "html", correct: 2, total: 2 },
        { domain: "css", correct: 2, total: 2 },
        { domain: "javascript", correct: 1, total: 1 },
      ],
    });
  });

  it("normalizes legacy TASK-201 sessionStorage without quiz fields", () => {
    const legacy = normalizeStoredOnboardingState({
      goalText: "A portfolio site",
      experienceLevel: "some_exposure",
      quizSkipped: false,
    });

    expect(legacy.quizCompleted).toBe(false);
    expect(legacy.quizAnswers).toEqual([]);
    expect(legacy.placementResult).toBeNull();
    expect(legacy.goalText).toBe("A portfolio site");
  });
});
