import { describe, expect, it } from "vitest";

import {
  shouldShowStuckHelpPrompt,
  stuckPromptCopy,
} from "@/lib/lesson-player/stuck-detection";

describe("shouldShowStuckHelpPrompt", () => {
  it("returns false with no struggle signals", () => {
    expect(
      shouldShowStuckHelpPrompt({
        localFailCount: 0,
        serverFailCount: 0,
        secondsOnBlock: 10,
        helpTurnsOnBlock: 0,
      }),
    ).toBe(false);
  });

  it("surfaces prompt after two local fails", () => {
    expect(
      shouldShowStuckHelpPrompt({
        localFailCount: 2,
        serverFailCount: 0,
        secondsOnBlock: 5,
        helpTurnsOnBlock: 0,
      }),
    ).toBe(true);
  });

  it("uses server fail count without choosing help level", () => {
    expect(
      shouldShowStuckHelpPrompt({
        localFailCount: 0,
        serverFailCount: 2,
        secondsOnBlock: 0,
        helpTurnsOnBlock: 0,
      }),
    ).toBe(true);
  });

  it("does not encode level eligibility", () => {
    expect(stuckPromptCopy()).not.toMatch(/level\s*4/i);
  });
});
