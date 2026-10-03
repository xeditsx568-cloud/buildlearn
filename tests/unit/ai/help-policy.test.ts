import { describe, expect, it } from "vitest";

import {
  applyBillableHelpDelivered,
  applyServerGraderResult,
  maxEligibleLevel,
  resolveEffectiveHelpLevel,
} from "@/ai/mentor/help-policy";
import {
  createInitialMentorBlockState,
  type MentorBlockState,
} from "@/lib/ai/mentor-contracts";

function state(
  partial: Partial<MentorBlockState> = {},
): MentorBlockState {
  return { ...createInitialMentorBlockState(), ...partial };
}

describe("maxEligibleLevel", () => {
  it("returns 1 with zero failures", () => {
    expect(maxEligibleLevel(state())).toBe(1);
  });

  it("returns 2 with one failure", () => {
    expect(maxEligibleLevel(state({ failedChecksSinceLastPass: 1 }))).toBe(2);
  });

  it("returns 3 with two failures and one help turn", () => {
    expect(
      maxEligibleLevel(
        state({ failedChecksSinceLastPass: 2, helpTurnCount: 1 }),
      ),
    ).toBe(3);
  });

  it("returns 4 only after L3 help and new failures", () => {
    const atL3 = applyBillableHelpDelivered(
      state({ failedChecksSinceLastPass: 2, helpTurnCount: 1 }),
      3,
    );
    expect(maxEligibleLevel(atL3)).toBe(3);

    const withNewFail = applyServerGraderResult(atL3, false, "try again");
    expect(maxEligibleLevel(withNewFail)).toBe(4);
  });
});

describe("resolveEffectiveHelpLevel — truth table", () => {
  it("first get_help with 0 fails → level 1", () => {
    expect(resolveEffectiveHelpLevel("get_help", state()).effectiveLevel).toBe(
      1,
    );
  });

  it("need_more_help ×3 with 0 grader fails stays at 1", () => {
    let s = state();
    for (let i = 0; i < 3; i++) {
      const { effectiveLevel } = resolveEffectiveHelpLevel("need_more_help", s);
      expect(effectiveLevel).toBe(1);
      s = applyBillableHelpDelivered(s, effectiveLevel);
    }
  });

  it("1 fail + get_help → up to 2", () => {
    const s = state({ failedChecksSinceLastPass: 1 });
    expect(resolveEffectiveHelpLevel("get_help", s).effectiveLevel).toBe(2);
  });

  it("2 fails, 1 help turn, need_more_help → up to 3", () => {
    let s = state({
      failedChecksSinceLastPass: 2,
      helpTurnCount: 1,
      lastLevelDelivered: 2,
    });
    const { effectiveLevel } = resolveEffectiveHelpLevel("need_more_help", s);
    expect(effectiveLevel).toBe(3);
    s = applyBillableHelpDelivered(s, 3);
    expect(s.lastLevelDelivered).toBe(3);
  });

  it("at level 3 help delivered, 0 new fails, need_more_help → 3 not 4", () => {
    const s = applyBillableHelpDelivered(
      state({ failedChecksSinceLastPass: 2, helpTurnCount: 1 }),
      3,
    );
    expect(resolveEffectiveHelpLevel("need_more_help", s).effectiveLevel).toBe(
      3,
    );
  });

  it("at level 3 help delivered, new grader fail → level 4 eligible", () => {
    let s = applyBillableHelpDelivered(
      state({ failedChecksSinceLastPass: 2, helpTurnCount: 1 }),
      3,
    );
    s = applyServerGraderResult(s, false, "still not quite");
    expect(maxEligibleLevel(s)).toBe(4);
    expect(resolveEffectiveHelpLevel("need_more_help", s).effectiveLevel).toBe(
      4,
    );
  });

  it("repeated need_more_help alone cannot reach 4 without new fails after L3", () => {
    let s = applyBillableHelpDelivered(
      state({ failedChecksSinceLastPass: 2, helpTurnCount: 1 }),
      3,
    );
    for (let i = 0; i < 5; i++) {
      const { effectiveLevel } = resolveEffectiveHelpLevel("need_more_help", s);
      expect(effectiveLevel).toBeLessThan(4);
      s = applyBillableHelpDelivered(s, effectiveLevel);
    }
  });
});

describe("applyServerGraderResult", () => {
  it("resets fail counter on pass", () => {
    const s = state({ failedChecksSinceLastPass: 3 });
    const next = applyServerGraderResult(s, true, "Correct!");
    expect(next.failedChecksSinceLastPass).toBe(0);
  });

  it("increments fail counter on server fail", () => {
    const next = applyServerGraderResult(state(), false, "Not yet");
    expect(next.failedChecksSinceLastPass).toBe(1);
  });
});
