import type {
  PlacementDomain,
  PlacementDomainSummary,
  PlacementQuizQuestion,
  PlacementResult,
  QuizAnswer,
} from "@/lib/onboarding/types";

function buildDomainSummary(
  questions: PlacementQuizQuestion[],
  answers: QuizAnswer[],
): PlacementDomainSummary[] {
  const domainStats = new Map<PlacementDomain, PlacementDomainSummary>();

  for (const question of questions) {
    const existing = domainStats.get(question.domain) ?? {
      domain: question.domain,
      correct: 0,
      total: 0,
    };

    existing.total += 1;

    const answer = answers.find(
      (candidate) => candidate.questionId === question.id,
    );

    if (answer && answer.selectedOptionId === question.correctOptionId) {
      existing.correct += 1;
    }

    domainStats.set(question.domain, existing);
  }

  return Array.from(domainStats.values());
}

/** Deterministic client-side placement scoring (TASK-202). */
export function scorePlacementQuiz(
  questions: PlacementQuizQuestion[],
  answers: QuizAnswer[],
): PlacementResult {
  const totalQuestions = questions.length;
  let totalCorrect = 0;

  for (const question of questions) {
    const answer = answers.find(
      (candidate) => candidate.questionId === question.id,
    );

    if (answer && answer.selectedOptionId === question.correctOptionId) {
      totalCorrect += 1;
    }
  }

  const percentage =
    totalQuestions === 0
      ? 0
      : Math.round((totalCorrect / totalQuestions) * 100);

  return {
    totalCorrect,
    totalQuestions,
    percentage,
    domainSummary: buildDomainSummary(questions, answers),
  };
}
