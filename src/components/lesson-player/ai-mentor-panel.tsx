"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  MentorHelpAction,
  MentorHelpResponse,
} from "@/lib/ai/mentor-contracts";
import { M3_MENTOR_LESSON_ID } from "@/lib/ai/mentor-contracts";
import {
  MentorApiError,
  fetchMentorQuota,
  postMentorHelp,
  type MentorHelpSource,
  type MentorQuotaResponse,
} from "@/lib/lesson-player/mentor-client";
import {
  MENTOR_ACTION_LABELS,
  MENTOR_PANEL_INTRO,
  MENTOR_PANEL_TITLE,
  mentorNetworkErrorCopy,
  mentorQuotaExhaustedCopy,
  mentorRateLimitedCopy,
  mentorUnavailableCopy,
} from "@/lib/lesson-player/mentor-copy";
import { isSameMentorBlockScope } from "@/lib/lesson-player/mentor-block-scope";
import { cn } from "@/lib/utils";

export type AiMentorPanelProps = {
  lessonId: string;
  blockIndex: number;
  learnerCode?: string;
  lastGraderMessage?: string | null;
  lastGraderPassed?: boolean | null;
  showStuckPrompt: boolean;
  onEditorFocus?: (line: number) => void;
  className?: string;
  variant?: "sidebar" | "sheet";
  onCloseSheet?: () => void;
};

type MentorMessage = {
  text: string;
  source: MentorHelpSource;
  suggestedActions: MentorHelpResponse["suggestedActions"];
  editorFocus?: MentorHelpResponse["editorFocus"];
};

function formatHelpMessage(text: string): string[] {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export function AiMentorPanel({
  lessonId,
  blockIndex,
  learnerCode,
  lastGraderMessage,
  lastGraderPassed,
  showStuckPrompt,
  onEditorFocus,
  className,
  variant = "sidebar",
  onCloseSheet,
}: AiMentorPanelProps) {
  const statusId = useId();
  const [quota, setQuota] = useState<MentorQuotaResponse | null>(null);
  const [loadingAction, setLoadingAction] = useState<MentorHelpAction | null>(
    null,
  );
  const [message, setMessage] = useState<MentorMessage | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);

  const activeScopeRef = useRef({ lessonId, blockIndex });
  const helpRequestGenerationRef = useRef(0);

  const mentorEnabled = lessonId === M3_MENTOR_LESSON_ID;

  useEffect(() => {
    activeScopeRef.current = { lessonId, blockIndex };
    helpRequestGenerationRef.current += 1;
    setMessage(null);
    setStatusText(null);
    setLoadingAction(null);
  }, [lessonId, blockIndex]);

  const refreshQuota = useCallback(async () => {
    if (!mentorEnabled) {
      return;
    }
    try {
      const next = await fetchMentorQuota();
      setQuota(next);
    } catch {
      /* Quota display is optional; do not block learning */
    }
  }, [mentorEnabled]);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota, blockIndex]);

  const requestHelp = useCallback(
    async (action: MentorHelpAction) => {
      if (!mentorEnabled || loadingAction) {
        return;
      }

      const requestScope = { lessonId, blockIndex };
      const requestGeneration = helpRequestGenerationRef.current;

      setLoadingAction(action);
      setStatusText(null);

      const applyBlockResult = (): boolean => {
        if (requestGeneration !== helpRequestGenerationRef.current) {
          return false;
        }
        return isSameMentorBlockScope(requestScope, activeScopeRef.current);
      };

      try {
        const { data, source } = await postMentorHelp({
          lessonId: M3_MENTOR_LESSON_ID,
          blockIndex,
          action,
          learnerCode,
          lastGraderResult:
            lastGraderMessage != null && lastGraderPassed != null
              ? { passed: lastGraderPassed, message: lastGraderMessage }
              : undefined,
        });

        if (!applyBlockResult()) {
          return;
        }

        setMessage({
          text: data.message,
          source,
          suggestedActions: data.suggestedActions,
          editorFocus: data.editorFocus,
        });
        setQuota({
          remainingThisMonth: data.quota.remainingThisMonth,
          limitThisMonth: quota?.limitThisMonth ?? data.quota.remainingThisMonth,
          resetAt: data.quota.resetAt,
        });
        setQuotaBlocked(false);

        if (data.editorFocus && onEditorFocus) {
          onEditorFocus(data.editorFocus.startLine);
        }

        void refreshQuota();
      } catch (error) {
        if (!applyBlockResult()) {
          return;
        }

        setMessage(null);
        if (error instanceof MentorApiError) {
          if (error.status === 429 && error.code === "quota_exhausted") {
            setQuotaBlocked(true);
            setStatusText(mentorQuotaExhaustedCopy());
            return;
          }
          if (error.status === 429) {
            setStatusText(mentorRateLimitedCopy(error.retryAfterSeconds));
            return;
          }
          if (error.status === 503) {
            setStatusText(mentorUnavailableCopy());
            return;
          }
        }
        setStatusText(mentorNetworkErrorCopy());
      } finally {
        if (requestGeneration === helpRequestGenerationRef.current) {
          setLoadingAction(null);
        }
      }
    },
    [
      blockIndex,
      lessonId,
      lastGraderMessage,
      lastGraderPassed,
      learnerCode,
      loadingAction,
      mentorEnabled,
      onEditorFocus,
      quota?.limitThisMonth,
      refreshQuota,
    ],
  );

  if (!mentorEnabled) {
    return null;
  }

  const primaryActions: MentorHelpAction[] = [
    "get_help",
    "explain_task",
    ...(lastGraderMessage ? (["explain_last_check"] as const) : []),
  ];

  const showNeedMore =
    message?.suggestedActions.includes("need_more_help") ?? false;

  const content = (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold">{MENTOR_PANEL_TITLE}</h2>
          {variant === "sheet" && onCloseSheet ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseSheet}
              aria-label="Close help panel"
            >
              Close
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{MENTOR_PANEL_INTRO}</p>
        {quota ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Help requests left this month: {quota.remainingThisMonth}
          </p>
        ) : null}
      </div>

      {showStuckPrompt && !message ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          Want a hint? Use the buttons below—we will explain in plain language.
        </p>
      ) : null}

      <div className="flex flex-col gap-2" role="group" aria-label="Help actions">
        {primaryActions.map((action) => (
          <Button
            key={action}
            type="button"
            variant={action === "get_help" ? "default" : "outline"}
            size="sm"
            disabled={Boolean(loadingAction) || quotaBlocked}
            onClick={() => void requestHelp(action)}
          >
            {loadingAction === action ? "Loading help…" : MENTOR_ACTION_LABELS[action]}
          </Button>
        ))}
        {showNeedMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(loadingAction) || quotaBlocked}
            onClick={() => void requestHelp("need_more_help")}
          >
            {loadingAction === "need_more_help"
              ? "Loading help…"
              : MENTOR_ACTION_LABELS.need_more_help}
          </Button>
        ) : null}
      </div>

      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className="min-h-[1rem] text-sm"
      >
        {loadingAction ? (
          <p className="text-muted-foreground">Finding the best way to explain…</p>
        ) : null}
        {statusText ? (
          <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
            {statusText}
          </p>
        ) : null}
      </div>

      {message ? (
        <article
          className="space-y-2 rounded-md border border-input bg-card px-3 py-3 text-sm"
          aria-labelledby={`${statusId}-help-heading`}
        >
          <p
            id={`${statusId}-help-heading`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {message.source === "fallback"
              ? "Step-by-step guide (offline help)"
              : "BuildLearn help"}
          </p>
          {message.editorFocus ? (
            <p className="text-xs text-primary">
              {message.editorFocus.label} (around line{" "}
              {message.editorFocus.startLine})
            </p>
          ) : null}
          <div className="space-y-2 leading-relaxed">
            {formatHelpMessage(message.text).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {message.suggestedActions.includes("try_again") ? (
            <p className="text-xs text-muted-foreground">
              Try a small change in your editor, then run check again.
            </p>
          ) : null}
        </article>
      ) : null}
    </div>
  );

  if (variant === "sheet") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[75vh] overflow-y-auto rounded-t-xl border border-input bg-background p-4 shadow-lg">
        {content}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-lg border border-input bg-muted/20 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto",
        className,
      )}
      aria-label="BuildLearn help for this step"
    >
      {content}
    </aside>
  );
}

type AiMentorFabProps = {
  onOpen: () => void;
  visible: boolean;
};

export function AiMentorFab({ onOpen, visible }: AiMentorFabProps) {
  if (!visible) {
    return null;
  }

  return (
    <Button
      type="button"
      className="fixed bottom-20 right-4 z-30 shadow-md lg:hidden"
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      Get help
    </Button>
  );
}
