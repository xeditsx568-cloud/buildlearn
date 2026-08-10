import { describe, expect, it } from "vitest";

import {
  isExperienceSelected,
  validateGoalText,
} from "@/lib/onboarding/validation";

describe("goal validation", () => {
  it("rejects fewer than 10 characters", () => {
    const result = validateGoalText("short");

    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      "Please describe your goal in at least 10 characters.",
    );
  });

  it("accepts valid 10–500 character input", () => {
    const result = validateGoalText("A portfolio site for my photography work");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects over 500 characters", () => {
    const result = validateGoalText("a".repeat(501));

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Goal must be 500 characters or fewer.");
  });

  it("trims whitespace before checking the minimum length", () => {
    const result = validateGoalText("          ");

    expect(result.valid).toBe(false);
  });
});

describe("experience selection requirement", () => {
  it("requires one of the three experience levels", () => {
    expect(isExperienceSelected(null)).toBe(false);
    expect(isExperienceSelected(undefined)).toBe(false);
    expect(isExperienceSelected("beginner")).toBe(true);
    expect(isExperienceSelected("some_exposure")).toBe(true);
    expect(isExperienceSelected("intermediate")).toBe(true);
  });
});
