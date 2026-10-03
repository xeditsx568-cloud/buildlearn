import { describe, expect, it } from "vitest";

import { InMemoryMentorBlockStateStore } from "@/server/services/mentor-block-state-store";

describe("InMemoryMentorBlockStateStore", () => {
  const scope = {
    userId: "user_1",
    lessonId: "how-websites-work",
    blockIndex: 4,
  };

  it("starts with zero failures", async () => {
    const store = new InMemoryMentorBlockStateStore();
    const s = await store.get(scope);
    expect(s.failedChecksSinceLastPass).toBe(0);
    expect(s.helpTurnCount).toBe(0);
  });

  it("increments failures only on server fail", async () => {
    const store = new InMemoryMentorBlockStateStore();
    await store.applyGraderResult(scope, false, "nope");
    await store.applyGraderResult(scope, false, "nope");
    const s = await store.get(scope);
    expect(s.failedChecksSinceLastPass).toBe(2);
  });

  it("resets failures on pass", async () => {
    const store = new InMemoryMentorBlockStateStore();
    await store.applyGraderResult(scope, false, "nope");
    await store.applyGraderResult(scope, true, "ok");
    const s = await store.get(scope);
    expect(s.failedChecksSinceLastPass).toBe(0);
  });
});
