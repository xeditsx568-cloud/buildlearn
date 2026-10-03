/**
 * @vitest-environment jsdom
 */
import { act } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lesson-player/mentor-client", () => ({
  fetchMentorQuota: vi.fn().mockResolvedValue({
    remainingThisMonth: 30,
    limitThisMonth: 30,
    resetAt: "2026-11-01T00:00:00.000Z",
  }),
  postMentorHelp: vi.fn(),
  MentorApiError: class MentorApiError extends Error {
    readonly status: number;
    readonly code?: string;
    constructor(message: string, status: number, options?: { code?: string }) {
      super(message);
      this.name = "MentorApiError";
      this.status = status;
      this.code = options?.code;
    }
  },
}));

import { AiMentorPanel } from "@/components/lesson-player/ai-mentor-panel";
import { postMentorHelp } from "@/lib/lesson-player/mentor-client";
import { shouldShowStuckHelpPrompt } from "@/lib/lesson-player/stuck-detection";
import { useEffect, useState } from "react";

const LESSON_ID = "how-websites-work";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AiMentorPanel block-scoped mentor state (B-W2-01)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(postMentorHelp).mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderPanel(props: {
    blockIndex: number;
    onEditorFocus?: (line: number) => void;
    showStuckPrompt?: boolean;
  }) {
    act(() => {
      root.render(
        <AiMentorPanel
          lessonId={LESSON_ID}
          blockIndex={props.blockIndex}
          learnerCode="<html></html>"
          showStuckPrompt={props.showStuckPrompt ?? false}
          onEditorFocus={props.onEditorFocus}
          variant="sidebar"
        />,
      );
    });
  }

  function clickGetHelp() {
    const button = Array.from(container.querySelectorAll("button")).find((el) =>
      el.textContent?.includes("Get help with this step"),
    );
    expect(button).toBeTruthy();
    act(() => button!.click());
  }

  it("does not show block A help message after navigating to block B before resolve", async () => {
    const pending = deferred<Awaited<ReturnType<typeof postMentorHelp>>>();

    vi.mocked(postMentorHelp).mockReturnValueOnce(pending.promise);

    renderPanel({ blockIndex: 3 });
    clickGetHelp();

    renderPanel({ blockIndex: 4 });

    await act(async () => {
      pending.resolve({
        source: "ai",
        data: {
          helpLevel: 1 as const,
          message: "Block A only: add HTML comments here",
          quota: { remainingThisMonth: 29, resetAt: "2026-11-01T00:00:00.000Z" },
          suggestedActions: ["try_again"],
        },
      });
      await pending.promise;
    });

    expect(container.textContent).not.toContain("Block A only");
  });

  it("does not call onEditorFocus after block change when stale response returns", async () => {
    const pending = deferred<Awaited<ReturnType<typeof postMentorHelp>>>();

    vi.mocked(postMentorHelp).mockReturnValueOnce(pending.promise);
    const onEditorFocus = vi.fn();

    renderPanel({ blockIndex: 3, onEditorFocus });
    clickGetHelp();

    renderPanel({ blockIndex: 5, onEditorFocus });

    await act(async () => {
      pending.resolve({
        source: "ai",
        data: {
          helpLevel: 2 as const,
          message: "Focus line 9",
          quota: { remainingThisMonth: 28, resetAt: "2026-11-01T00:00:00.000Z" },
          suggestedActions: ["try_again"],
          editorFocus: { startLine: 9, endLine: 9, label: "Near html" },
        },
      });
      await pending.promise;
    });

    expect(onEditorFocus).not.toHaveBeenCalled();
  });

  it("clears prior block message and stuck UI when blockIndex changes", async () => {
    vi.mocked(postMentorHelp).mockResolvedValueOnce({
      source: "ai",
      data: {
        helpLevel: 1,
        message: "Visible help on block three",
        quota: { remainingThisMonth: 29, resetAt: "2026-11-01T00:00:00.000Z" },
        suggestedActions: ["need_more_help"],
      },
    });

    renderPanel({ blockIndex: 3, showStuckPrompt: true });
    clickGetHelp();

    await act(async () => {
      await vi.mocked(postMentorHelp).mock.results[0]?.value;
    });

    expect(container.textContent).toContain("Visible help on block three");
    expect(container.textContent).toContain("I need more help");

    renderPanel({ blockIndex: 4, showStuckPrompt: false });

    expect(container.textContent).not.toContain("Visible help on block three");
    expect(container.textContent).not.toContain("I need more help");
    expect(container.textContent).not.toContain("Want a hint?");
  });

  it("renders help and editor focus when request completes on the same block", async () => {
    vi.mocked(postMentorHelp).mockResolvedValueOnce({
      source: "ai",
      data: {
        helpLevel: 1,
        message: "Same block help text",
        quota: { remainingThisMonth: 29, resetAt: "2026-11-01T00:00:00.000Z" },
        suggestedActions: ["try_again"],
        editorFocus: { startLine: 2, endLine: 2, label: "Top of file" },
      },
    });

    const onEditorFocus = vi.fn();
    renderPanel({ blockIndex: 3, onEditorFocus });
    clickGetHelp();

    await act(async () => {
      await vi.mocked(postMentorHelp).mock.results[0]?.value;
    });

    expect(container.textContent).toContain("Same block help text");
    expect(onEditorFocus).toHaveBeenCalledWith(2);
  });
});

/** Mirrors LessonPlayer block navigation reset for stuck presentation (B-W2-02). */
function MentorStuckHarness({ blockIndex }: { blockIndex: number }) {
  const [localFailCount, setLocalFailCount] = useState(0);
  const [serverFailCount, setServerFailCount] = useState(0);
  const [blockEnteredAt, setBlockEnteredAt] = useState(() => Date.now());

  useEffect(() => {
    setLocalFailCount(0);
    setServerFailCount(0);
    setBlockEnteredAt(Date.now());
  }, [blockIndex]);

  const secondsOnBlock = Math.floor((Date.now() - blockEnteredAt) / 1000);
  const showStuck = shouldShowStuckHelpPrompt({
    localFailCount,
    serverFailCount,
    secondsOnBlock,
    helpTurnsOnBlock: 0,
  });

  return (
    <div>
      <button
        type="button"
        data-testid="bump-local"
        onClick={() => setLocalFailCount((count) => count + 1)}
      >
        bump local fail
      </button>
      <button
        type="button"
        data-testid="bump-server"
        onClick={() => setServerFailCount((count) => count + 1)}
      >
        bump server fail
      </button>
      <span data-testid="stuck">{showStuck ? "stuck" : "ok"}</span>
      <span data-testid="local">{localFailCount}</span>
      <span data-testid="server">{serverFailCount}</span>
    </div>
  );
}

describe("LessonPlayer stuck presentation reset on block change (B-W2-02)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("does not inherit stuck state from previous block after navigation", () => {
    act(() => {
      root.render(<MentorStuckHarness blockIndex={3} />);
    });

    const bumpLocal = container.querySelector('[data-testid="bump-local"]')!;
    act(() => bumpLocal.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    act(() => bumpLocal.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(container.querySelector('[data-testid="stuck"]')?.textContent).toBe(
      "stuck",
    );

    act(() => {
      root.render(<MentorStuckHarness blockIndex={4} />);
    });

    expect(container.querySelector('[data-testid="stuck"]')?.textContent).toBe(
      "ok",
    );
    expect(container.querySelector('[data-testid="local"]')?.textContent).toBe(
      "0",
    );
    expect(container.querySelector('[data-testid="server"]')?.textContent).toBe(
      "0",
    );
  });
});
