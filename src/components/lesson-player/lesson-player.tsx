"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ExplainBody } from "@/components/lesson-player/explain-body";
import { HtmlPreview } from "@/components/lesson-player/html-preview";
import { MonacoHtmlEditor } from "@/components/lesson-player/monaco-html-editor";
import {
  gradeExerciseBlock,
  gradeInteractBlock,
  gradeQuizSelection,
} from "@/lib/grading/html-lesson-graders";
import { completeLesson, patchLessonProgress } from "@/lib/lesson-player/api-client";
import type {
  GraderResult,
  LessonWithAccessResponse,
} from "@/lib/lesson-player/contracts";
import { isGradedBlock } from "@/lib/lesson-player/contracts";
import {
  canAdvanceFromBlock,
  canCompleteLesson,
  getInitialBlockIndex,
  isBlockPassed,
} from "@/lib/lesson-player/navigation";
import {
  invalidateGradedBlockPass,
  shouldInvalidateEditorOnChange,
  shouldInvalidateQuizOnSelectionChange,
} from "@/lib/lesson-player/pass-state";
import type { LessonBlock } from "@/lib/schemas/lesson";
import { cn } from "@/lib/utils";

type LessonPlayerProps = {
  initialData: LessonWithAccessResponse;
};

export function LessonPlayer({ initialData }: LessonPlayerProps) {
  const router = useRouter();
  const { lesson } = initialData;
  const blocks = lesson.blocks;

  const [blocksCompleted, setBlocksCompleted] = useState<number[]>(
    () => initialData.progress?.blocksCompleted ?? [],
  );
  const [quizScore, setQuizScore] = useState<number | null>(
    () => initialData.progress?.quizScore ?? null,
  );
  const [blockIndex, setBlockIndex] = useState(() =>
    getInitialBlockIndex(blocks, initialData.progress?.blocksCompleted ?? []),
  );
  const [editorCode, setEditorCode] = useState("");
  const [graderFeedback, setGraderFeedback] = useState<GraderResult | null>(
    null,
  );
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasMarkedStarted, setHasMarkedStarted] = useState(
    () => initialData.progress?.status === "started",
  );

  const currentBlock = blocks[blockIndex] as LessonBlock | undefined;
  const totalBlocks = blocks.length;

  const syncEditorToBlock = useCallback(
    (index: number) => {
      const block = blocks[index];
      if (block?.type === "interact" || block?.type === "exercise") {
        setEditorCode(block.starterCode);
      }
      setGraderFeedback(null);
      setSelectedQuizOption(null);
    },
    [blocks],
  );

  useEffect(() => {
    syncEditorToBlock(blockIndex);
  }, [blockIndex, syncEditorToBlock]);

  useEffect(() => {
    if (hasMarkedStarted) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await patchLessonProgress(lesson.id, { status: "started" });
        if (!cancelled) {
          setHasMarkedStarted(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSaveError(
            error instanceof Error
              ? error.message
              : "Could not start lesson progress",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasMarkedStarted, lesson.id]);

  const persistProgress = useCallback(
    async (nextBlocks: number[], nextQuizScore: number | null) => {
      setSaveError(null);
      try {
        await patchLessonProgress(lesson.id, {
          blocksCompleted: nextBlocks,
          quizScore: nextQuizScore,
        });
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Could not save progress",
        );
      }
    },
    [lesson.id],
  );

  const markBlockPassed = useCallback(
    async (index: number, nextQuizScore: number | null = quizScore) => {
      const nextBlocks = blocksCompleted.includes(index)
        ? blocksCompleted
        : [...blocksCompleted, index].sort((a, b) => a - b);

      setBlocksCompleted(nextBlocks);
      if (nextQuizScore !== quizScore) {
        setQuizScore(nextQuizScore);
      }

      await persistProgress(nextBlocks, nextQuizScore);
    },
    [blocksCompleted, persistProgress, quizScore],
  );

  const invalidatePassForCurrentBlock = useCallback(async () => {
    const block = blocks[blockIndex];
    const { blocksCompleted: nextBlocks, quizScore: nextQuizScore } =
      invalidateGradedBlockPass(
        blocksCompleted,
        blockIndex,
        block,
        quizScore,
      );

    if (
      nextBlocks.length === blocksCompleted.length &&
      nextQuizScore === quizScore
    ) {
      return;
    }

    setBlocksCompleted(nextBlocks);
    setQuizScore(nextQuizScore);
    setGraderFeedback(null);
    await persistProgress(nextBlocks, nextQuizScore);
  }, [blockIndex, blocks, blocksCompleted, persistProgress, quizScore]);

  const handleEditorChange = (value: string) => {
    const block = blocks[blockIndex];
    if (shouldInvalidateEditorOnChange(blocksCompleted, blockIndex, block)) {
      void invalidatePassForCurrentBlock();
    }
    setEditorCode(value);
  };

  const handleQuizOptionChange = (optionId: string) => {
    if (
      shouldInvalidateQuizOnSelectionChange(
        blocksCompleted,
        blockIndex,
        quizScore,
        selectedQuizOption,
        optionId,
      )
    ) {
      void invalidatePassForCurrentBlock();
    }
    setSelectedQuizOption(optionId);
  };

  const runInteractCheck = () => {
    const block = blocks[blockIndex];
    if (block?.type !== "interact") {
      return;
    }

    const result = gradeInteractBlock(editorCode, block.starterCode);
    setGraderFeedback(result);
    if (result.passed) {
      void markBlockPassed(blockIndex);
    }
  };

  const runExerciseCheck = () => {
    const block = blocks[blockIndex];
    if (block?.type !== "exercise") {
      return;
    }

    const result = gradeExerciseBlock(editorCode);
    setGraderFeedback(result);
    if (result.passed) {
      void markBlockPassed(blockIndex);
    }
  };

  const runQuizCheck = () => {
    const block = blocks[blockIndex];
    if (block?.type !== "quiz" || !selectedQuizOption) {
      setGraderFeedback({
        passed: false,
        message: "Select an answer before checking.",
      });
      return;
    }

    const result = gradeQuizSelection(
      selectedQuizOption,
      block.correctOptionId,
    );
    setGraderFeedback(result);
    if (result.passed) {
      void markBlockPassed(blockIndex, 1);
    }
  };

  const canContinue = useMemo(
    () => canAdvanceFromBlock(blockIndex, blocks, blocksCompleted, quizScore),
    [blockIndex, blocks, blocksCompleted, quizScore],
  );

  const showCompleteLesson = useMemo(
    () => currentBlock?.type === "bridge" && canCompleteLesson(blocks, blocksCompleted, quizScore),
    [blocks, blocksCompleted, currentBlock?.type, quizScore],
  );

  const goBack = () => {
    if (blockIndex > 0) {
      setBlockIndex(blockIndex - 1);
    }
  };

  const goContinue = () => {
    if (!canContinue || blockIndex >= totalBlocks - 1) {
      return;
    }
    setBlockIndex(blockIndex + 1);
  };

  const handleCompleteLesson = async () => {
    if (!canCompleteLesson(blocks, blocksCompleted, quizScore)) {
      return;
    }

    setIsCompleting(true);
    setSaveError(null);

    try {
      await completeLesson(lesson.id, {
        blocksCompleted,
        quizScore,
      });
      router.push("/roadmap");
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not complete lesson",
      );
      setIsCompleting(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2 border-b border-input pb-4">
        <Link
          href="/roadmap"
          className="text-sm text-primary underline underline-offset-4"
        >
          ← Back to roadmap
        </Link>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground">
          Block {blockIndex + 1} of {totalBlocks}
        </p>
        <div
          className="flex gap-1"
          role="progressbar"
          aria-valuenow={blockIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalBlocks}
          aria-label="Lesson progress"
        >
          {blocks.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index <= blockIndex ? "bg-primary" : "bg-muted",
                isBlockPassed(index, blocksCompleted) && "bg-primary/80",
              )}
            />
          ))}
        </div>
      </header>

      {saveError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {saveError}
        </p>
      ) : null}

      <article className="space-y-4">
        {currentBlock?.type === "objective" ? (
          <>
            <h2 className="text-lg font-medium">{currentBlock.title}</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {currentBlock.objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}

        {currentBlock?.type === "explain" ? (
          <>
            {currentBlock.title ? (
              <h2 className="text-lg font-medium">{currentBlock.title}</h2>
            ) : null}
            <ExplainBody body={currentBlock.body} />
            {currentBlock.code ? (
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {currentBlock.code.content}
              </pre>
            ) : null}
          </>
        ) : null}

        {currentBlock?.type === "interact" ? (
          <>
            {currentBlock.title ? (
              <h2 className="text-lg font-medium">{currentBlock.title}</h2>
            ) : null}
            <p className="text-sm">{currentBlock.instructions}</p>
            <MonacoHtmlEditor
              value={editorCode}
              onChange={handleEditorChange}
              ariaLabel="HTML editor for interact activity"
            />
            <HtmlPreview html={editorCode} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={runInteractCheck}>
                Check my work
              </Button>
              {currentBlock.hint ? (
                <p className="text-xs text-muted-foreground">
                  Hint: {currentBlock.hint}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {currentBlock?.type === "exercise" ? (
          <>
            <h2 className="text-lg font-medium">{currentBlock.title}</h2>
            <p className="text-sm">{currentBlock.instructions}</p>
            <MonacoHtmlEditor
              value={editorCode}
              onChange={handleEditorChange}
              ariaLabel="HTML editor for exercise"
            />
            <HtmlPreview html={editorCode} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={runExerciseCheck}>
                Run check
              </Button>
              {currentBlock.solutionHint ? (
                <p className="text-xs text-muted-foreground">
                  Hint: {currentBlock.solutionHint}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {currentBlock?.type === "quiz" ? (
          <>
            <h2 className="text-lg font-medium">Quick check</h2>
            <p className="text-sm font-medium">{currentBlock.question}</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Quiz options</legend>
              {currentBlock.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary"
                >
                  <input
                    type="radio"
                    name="quiz-option"
                    value={option.id}
                    checked={selectedQuizOption === option.id}
                    onChange={() => handleQuizOptionChange(option.id)}
                    className="mt-1"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            <Button type="button" onClick={runQuizCheck}>
              Check answer
            </Button>
          </>
        ) : null}

        {currentBlock?.type === "bridge" ? (
          <>
            <h2 className="text-lg font-medium">Up next</h2>
            <ExplainBody body={currentBlock.body} />
            {currentBlock.nextLessonTitle ? (
              <p className="text-sm text-muted-foreground">
                Next lesson: {currentBlock.nextLessonTitle}
              </p>
            ) : null}
            {showCompleteLesson ? (
              <Button
                type="button"
                size="lg"
                disabled={isCompleting}
                onClick={() => void handleCompleteLesson()}
              >
                {isCompleting ? "Saving…" : "Complete lesson"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Finish the interact, exercise, and quiz sections before
                completing this lesson.
              </p>
            )}
          </>
        ) : null}

        {graderFeedback ? (
          <p
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              graderFeedback.passed
                ? "bg-emerald-50 text-emerald-900"
                : "bg-amber-50 text-amber-950",
            )}
            role="status"
          >
            {graderFeedback.message}
          </p>
        ) : null}

        {currentBlock &&
        isGradedBlock(currentBlock) &&
        isBlockPassed(blockIndex, blocksCompleted) ? (
          <p className="text-sm text-emerald-700">This section is complete.</p>
        ) : null}
      </article>

      <footer className="flex items-center justify-between gap-4 border-t border-input pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={blockIndex === 0}
          onClick={goBack}
        >
          Back
        </Button>
        {currentBlock?.type !== "bridge" ? (
          <Button type="button" disabled={!canContinue} onClick={goContinue}>
            Continue
          </Button>
        ) : null}
      </footer>
    </section>
  );
}
