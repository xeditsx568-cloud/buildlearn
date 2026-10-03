import { describe, expect, it } from "vitest";

import {
  mentorGraderEventRequestSchema,
  mentorHelpRequestSchema,
} from "@/lib/ai/mentor-contracts";

describe("mentorHelpRequestSchema", () => {
  const valid = {
    lessonId: "how-websites-work",
    blockIndex: 4,
    action: "get_help" as const,
    learnerCode: "<p>hi</p>",
  };

  it("accepts valid client context", () => {
    expect(mentorHelpRequestSchema.parse(valid)).toMatchObject(valid);
  });

  it("rejects authoritative passed field", () => {
    expect(() =>
      mentorHelpRequestSchema.parse({ ...valid, passed: false }),
    ).toThrow();
  });

  it("rejects failure counters", () => {
    expect(() =>
      mentorHelpRequestSchema.parse({
        ...valid,
        failedChecksSinceLastPass: 99,
      }),
    ).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() =>
      mentorHelpRequestSchema.parse({ ...valid, extra: true }),
    ).toThrow();
  });
});

describe("mentorGraderEventRequestSchema", () => {
  const valid = {
    lessonId: "how-websites-work",
    blockIndex: 4,
    learnerCode: "<html></html>",
  };

  it("accepts learnerCode without passed", () => {
    expect(mentorGraderEventRequestSchema.parse(valid)).toEqual(valid);
  });

  it("rejects client passed", () => {
    expect(() =>
      mentorGraderEventRequestSchema.parse({ ...valid, passed: false }),
    ).toThrow();
  });

  it("rejects client failed alias", () => {
    expect(() =>
      mentorGraderEventRequestSchema.parse({ ...valid, failed: true }),
    ).toThrow();
  });
});
