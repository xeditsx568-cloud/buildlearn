"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AiMentorFab,
  AiMentorPanel,
} from "@/components/lesson-player/ai-mentor-panel";
import { Button } from "@/components/ui/button";
import { ExplainBody } from "@/components/lesson-player/explain-body";
import { HtmlPreview } from "@/components/lesson-player/html-preview";
import { MonacoHtmlEditor } from "@/components/lesson-player/monaco-html-editor";
import { M3_MENTOR_LESSON_ID } from "@/lib/ai/mentor-contracts";
import { syncMentorGraderEvent } from "@/lib/lesson-player/grader-event-client";
import {
  shouldShowStuckHelpPrompt,
  stuckPromptCopy,
} from "@/lib/lesson-player/stuck-detection";
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
  const [localFailCount, setLocalFailCount] = useState(0);
  const [serverFailCount, setServerFailCount] = useState(0);
  const [blockEnteredAt, setBlockEnteredAt] = useState(() => Date.now());
  const [editorRevealLine, setEditorRevealLine] = useState<number | null>(
    null,
  );
  const [mobileMentorOpen, setMobileMentorOpen] = useState(false);

  const mentorLessonEnabled = lesson.id === M3_MENTOR_LESSON_ID;

  const mentorBlockScopeRef = useRef({
    lessonId: lesson.id,
    blockIndex,
  });

  useEffect(() => {
    mentorBlockScopeRef.current = { lessonId: lesson.id, blockIndex };
  }, [lesson.id, blockIndex]);

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
    setLocalFailCount(0);
    setServerFailCount(0);
    setBlockEnteredAt(Date.now());
    setEditorRevealLine(null);
    setMobileMentorOpen(false);
  }, [blockIndex, syncEditorToBlock]);

  const mentorBlockActive =
    mentorLessonEnabled &&
    currentBlock != null &&
    (currentBlock.type === "interact" ||
      currentBlock.type === "exercise" ||
      currentBlock.type === "quiz" ||
      currentBlock.type === "explain");

  const secondsOnBlock = Math.floor((Date.now() - blockEnteredAt) / 1000);

  const showStuckPrompt =
    mentorBlockActive &&
    shouldShowStuckHelpPrompt({
      localFailCount,
      serverFailCount,
      secondsOnBlock,
      helpTurnsOnBlock: 0,
    });

  const syncServerGraderEvent = useCallback(
    (payload: { learnerCode?: string; selectedOptionId?: string }) => {
      if (!mentorLessonEnabled) {
        return;
      }

      syncMentorGraderEvent(
        {
          lessonId: M3_MENTOR_LESSON_ID,
          blockIndex,
          ...payload,
        },
        (result) => {
          setServerFailCount(result.blockState.failedChecksSinceLastPass);
        },
        { getActiveScope: () => mentorBlockScopeRef.current },
      );
    },
    [blockIndex, mentorLessonEnabled],
  );

  const applyGraderResult = useCallback(
    (result: GraderResult, syncPayload?: Parameters<typeof syncServerGraderEvent>[0]) => {
      setGraderFeedback(result);
      if (result.passed) {
        setLocalFailCount(0);
      } else {
        setLocalFailCount((count) => count + 1);
      }
      if (syncPayload) {
        syncServerGraderEvent(syncPayload);
      }
    },
    [syncServerGraderEvent],
  );

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
    applyGraderResult(result, { learnerCode: editorCode });
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
    applyGraderResult(result, { learnerCode: editorCode });
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
    applyGraderResult(result, { selectedOptionId: selectedQuizOption });
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
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-6">
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
              revealLine={editorRevealLine}
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
              revealLine={editorRevealLine}
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

        {showStuckPrompt && mentorBlockActive ? (
          <p className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
            {stuckPromptCopy()}
          </p>
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

        {mentorBlockActive ? (
          <div className="hidden lg:block">
            <AiMentorPanel
              lessonId={lesson.id}
              blockIndex={blockIndex}
              learnerCode={
                currentBlock?.type === "interact" ||
                currentBlock?.type === "exercise"
                  ? editorCode
                  : undefined
              }
              lastGraderMessage={graderFeedback?.message ?? null}
              lastGraderPassed={graderFeedback?.passed ?? null}
              showStuckPrompt={showStuckPrompt}
              onEditorFocus={(line) => setEditorRevealLine(line)}
              variant="sidebar"
            />
          </div>
        ) : null}
      </div>

      {mentorBlockActive ? (
        <>
          <AiMentorFab
            visible={!mobileMentorOpen}
            onOpen={() => setMobileMentorOpen(true)}
          />
          {mobileMentorOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                aria-label="Close help panel"
                onClick={() => setMobileMentorOpen(false)}
              />
              <AiMentorPanel
                lessonId={lesson.id}
                blockIndex={blockIndex}
                learnerCode={
                  currentBlock?.type === "interact" ||
                  currentBlock?.type === "exercise"
                    ? editorCode
                    : undefined
                }
                lastGraderMessage={graderFeedback?.message ?? null}
                lastGraderPassed={graderFeedback?.passed ?? null}
                showStuckPrompt={showStuckPrompt}
                onEditorFocus={(line) => setEditorRevealLine(line)}
                variant="sheet"
                onCloseSheet={() => setMobileMentorOpen(false)}
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
