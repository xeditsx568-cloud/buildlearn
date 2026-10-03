import type {
  HelpLevel,
  MentorBlockState,
  MentorHelpAction,
} from "@/lib/ai/mentor-contracts";

export type HelpPolicyResult = {
  requestedLevel: HelpLevel;
  effectiveLevel: HelpLevel;
  maxEligibleLevel: HelpLevel;
};

/** Highest help level policy allows given server block state (§7.2). */
export function maxEligibleLevel(state: MentorBlockState): HelpLevel {
  const fails = state.failedChecksSinceLastPass;

  if (
    state.lastLevelDelivered >= 3 &&
    state.helpTurnCount >= 2 &&
    fails >= 2 &&
    fails > state.failedChecksAtLastHelp
  ) {
    return 4;
  }

  if (fails >= 2 && state.helpTurnCount >= 1) {
    return 3;
  }

  if (fails >= 1) {
    return 2;
  }

  return 1;
}

function clampToHelpLevel(value: number, cap: HelpLevel): HelpLevel {
  const level = Math.max(1, Math.min(4, Math.floor(value))) as HelpLevel;
  return (level > cap ? cap : level) as HelpLevel;
}

/** Raw requested level before cap (§7.2 requestedLevel table). */
export function requestedLevel(
  action: MentorHelpAction,
  state: MentorBlockState,
): HelpLevel {
  const cap = maxEligibleLevel(state);

  switch (action) {
    case "explain_task":
      return 1;
    case "explain_last_check":
      return clampToHelpLevel(state.failedChecksSinceLastPass >= 1 ? 2 : 1, cap);
    case "get_help":
      if (state.helpTurnCount === 0) {
        return clampToHelpLevel(
          state.failedChecksSinceLastPass >= 1 ? 2 : 1,
          cap,
        );
      }
      return clampToHelpLevel(
        Math.max(state.lastLevelDelivered, 1),
        cap,
      );
    case "need_more_help": {
      const base =
        state.lastLevelDelivered === 0 ? 1 : state.lastLevelDelivered + 1;
      return clampToHelpLevel(base, cap);
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function resolveEffectiveHelpLevel(
  action: MentorHelpAction,
  state: MentorBlockState,
): HelpPolicyResult {
  const cap = maxEligibleLevel(state);
  const requested = requestedLevel(action, state);
  const effective = clampToHelpLevel(requested, cap);

  return {
    requestedLevel: requested,
    effectiveLevel: effective,
    maxEligibleLevel: cap,
  };
}

/** After a billable mentor response at level L (§7.2). */
export function applyBillableHelpDelivered(
  state: MentorBlockState,
  level: HelpLevel,
  now: Date = new Date(),
): MentorBlockState {
  return {
    ...state,
    lastLevelDelivered: level,
    helpTurnCount: state.helpTurnCount + 1,
    failedChecksAtLastHelp: state.failedChecksSinceLastPass,
    updatedAt: now.toISOString(),
  };
}

/** Server-verified grader outcome updates struggle counters (§5.3). */
export function applyServerGraderResult(
  state: MentorBlockState,
  passed: boolean,
  message: string,
  now: Date = new Date(),
): MentorBlockState {
  if (passed) {
    return {
      ...state,
      failedChecksSinceLastPass: 0,
      lastGraderMessage: message,
      updatedAt: now.toISOString(),
    };
  }

  return {
    ...state,
    failedChecksSinceLastPass: state.failedChecksSinceLastPass + 1,
    lastGraderMessage: message,
    updatedAt: now.toISOString(),
  };
}
