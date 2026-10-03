/**
 * UX-only stuck signals — never used to choose help level (server policy is authoritative).
 */

export type StuckDetectionInput = {
  localFailCount: number;
  serverFailCount: number;
  secondsOnBlock: number;
  helpTurnsOnBlock: number;
};

export function shouldShowStuckHelpPrompt(input: StuckDetectionInput): boolean {
  if (input.serverFailCount >= 2) {
    return true;
  }
  if (input.localFailCount >= 2) {
    return true;
  }
  if (input.secondsOnBlock >= 180) {
    return true;
  }
  return false;
}

export function stuckPromptCopy(): string {
  return "Having trouble with this step? BuildLearn can walk you through it.";
}
