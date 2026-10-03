import {
  createInitialMentorBlockState,
  type MentorBlockState,
} from "@/lib/ai/mentor-contracts";
import { applyServerGraderResult } from "@/ai/mentor/help-policy";

export type MentorBlockScope = {
  userId: string;
  lessonId: string;
  blockIndex: number;
};

function scopeKey(scope: MentorBlockScope): string {
  return `${scope.userId}:${scope.lessonId}:${scope.blockIndex}`;
}

export interface MentorBlockStateStore {
  get(scope: MentorBlockScope): Promise<MentorBlockState>;
  set(scope: MentorBlockScope, state: MentorBlockState): Promise<void>;
  applyGraderResult(
    scope: MentorBlockScope,
    passed: boolean,
    message: string,
  ): Promise<MentorBlockState>;
}

/** Dev/test only — not for production (B-M3-03). */
export class InMemoryMentorBlockStateStore implements MentorBlockStateStore {
  private readonly map = new Map<string, MentorBlockState>();

  async get(scope: MentorBlockScope): Promise<MentorBlockState> {
    const existing = this.map.get(scopeKey(scope));
    if (existing) {
      return { ...existing };
    }
    const initial = createInitialMentorBlockState();
    this.map.set(scopeKey(scope), initial);
    return { ...initial };
  }

  async set(scope: MentorBlockScope, state: MentorBlockState): Promise<void> {
    this.map.set(scopeKey(scope), { ...state });
  }

  async applyGraderResult(
    scope: MentorBlockScope,
    passed: boolean,
    message: string,
  ): Promise<MentorBlockState> {
    const current = await this.get(scope);
    const next = applyServerGraderResult(current, passed, message);
    await this.set(scope, next);
    return next;
  }
}
