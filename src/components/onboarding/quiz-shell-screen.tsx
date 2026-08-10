"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { getPlacementQuizQuestions } from "@/lib/onboarding/placement-quiz";
import type { PlacementQuizQuestion, QuizAnswer } from "@/lib/onboarding/types";

interface PlacementQuizViewProps {
  questions: PlacementQuizQuestion[];
  currentQuestionIndex: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  onSkip: () => void;
  nextDisabled: boolean;
  nextLabel: string;
}

export function PlacementQuizView({
  questions,
  currentQuestionIndex,
  selectedOptionId,
  onSelectOption,
  onNext,
  onSkip,
  nextDisabled,
  nextLabel,
}: PlacementQuizViewProps) {
  const question = questions[currentQuestionIndex];

  if (!question) {
    return null;
  }

  const inputName = `placement-quiz-${question.id}`;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Optional placement quiz</h1>
        <p className="text-muted-foreground">
          Answer a few quick questions so we can tailor your starting point.
          You can skip this step if you are not sure.
        </p>
      </header>

      <nav aria-label="Quiz progress" className="flex items-center gap-2">
        {questions.map((item, index) => {
          const isComplete = index < currentQuestionIndex;
          const isCurrent = index === currentQuestionIndex;

          return (
            <span
              key={item.id}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Question ${index + 1} of ${questions.length}${
                isComplete ? ", completed" : isCurrent ? ", current" : ""
              }`}
              className={`inline-flex size-3 rounded-full ${
                isComplete || isCurrent ? "bg-primary" : "bg-muted"
              }`}
            />
          );
        })}
      </nav>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <h2 className="text-lg font-medium" id={`${question.id}-prompt`}>
          {question.prompt}
        </h2>

        <div
          role="radiogroup"
          aria-labelledby={`${question.id}-prompt`}
          className="flex flex-col gap-3"
        >
          {question.options.map((option) => {
            const selected = selectedOptionId === option.id;

            return (
              <label
                key={option.id}
                className={`flex min-h-11 cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                  selected ? "border-primary bg-muted/40" : "border-input"
                }`}
              >
                <input
                  type="radio"
                  name={inputName}
                  value={option.id}
                  checked={selected}
                  onChange={() => onSelectOption(option.id)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="block text-sm leading-6">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={onSkip}
        >
          I&apos;m not sure — skip quiz
        </Button>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={nextDisabled}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </section>
  );
}

export function QuizShellScreen() {
  const router = useRouter();
  const { hydrated, markQuizSkipped, completeQuiz } = useOnboarding();
  const questions = getPlacementQuizQuestions();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  if (!hydrated) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const nextDisabled = selectedOptionId === null;
  const nextLabel = isLastQuestion ? "Complete quiz →" : "Next →";

  function handleSelectOption(optionId: string) {
    setSelectedOptionId(optionId);
  }

  function handleSkip() {
    markQuizSkipped();
    router.push("/onboarding/path");
  }

  function handleNext() {
    if (!currentQuestion || !selectedOptionId) {
      return;
    }

    const updatedAnswers: QuizAnswer[] = [
      ...answers.filter((answer) => answer.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        selectedOptionId,
      },
    ];

    if (isLastQuestion) {
      completeQuiz(updatedAnswers);
      router.push("/onboarding/path");
      return;
    }

    setAnswers(updatedAnswers);
    setCurrentQuestionIndex((index) => index + 1);
    setSelectedOptionId(null);
  }

  return (
    <PlacementQuizView
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      selectedOptionId={selectedOptionId}
      onSelectOption={handleSelectOption}
      onNext={handleNext}
      onSkip={handleSkip}
      nextDisabled={nextDisabled}
      nextLabel={nextLabel}
    />
  );
}

/** Static quiz view for tests. */
export function QuizShellScreenStatic({
  currentQuestionIndex = 0,
  selectedOptionId = null,
  nextDisabled = true,
  nextLabel = "Next →",
}: {
  currentQuestionIndex?: number;
  selectedOptionId?: string | null;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  const questions = getPlacementQuizQuestions();

  return (
    <PlacementQuizView
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      selectedOptionId={selectedOptionId}
      onSelectOption={() => undefined}
      onNext={() => undefined}
      onSkip={() => undefined}
      nextDisabled={nextDisabled}
      nextLabel={nextLabel}
    />
  );
}
