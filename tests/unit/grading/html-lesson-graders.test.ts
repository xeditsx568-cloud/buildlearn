import { describe, expect, it } from "vitest";

import {
  gradeExerciseBlock,
  gradeInteractBlock,
  gradeQuizSelection,
} from "@/lib/grading/html-lesson-graders";

const INTERACT_STARTER = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Business Website</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <p>We help customers with quality products and friendly service.</p>
  </body>
</html>`;

describe("gradeInteractBlock", () => {
  it("passes when paragraph text changes", () => {
    const edited = INTERACT_STARTER.replace(
      "We help customers with quality products and friendly service.",
      "We sell handmade pottery online.",
    );
    expect(gradeInteractBlock(edited, INTERACT_STARTER).passed).toBe(true);
  });

  it("fails when starter is unchanged", () => {
    expect(gradeInteractBlock(INTERACT_STARTER, INTERACT_STARTER).passed).toBe(
      false,
    );
  });
});

describe("gradeExerciseBlock", () => {
  it("passes when comments precede html, head, and body", () => {
    const solution = `<!-- document -->
<html lang="en">
<!-- head section -->
<head>
<meta charset="UTF-8" />
<title>How Websites Work</title>
</head>
<!-- body section -->
<body>
<h1>How Websites Work</h1>
</body>
</html>`;
    expect(gradeExerciseBlock(solution).passed).toBe(true);
  });

  it("fails when comments are missing", () => {
    expect(
      gradeExerciseBlock("<html><head></head><body></body></html>").passed,
    ).toBe(false);
  });
});

describe("gradeQuizSelection", () => {
  it("passes for correct option", () => {
    expect(gradeQuizSelection("b", "b").passed).toBe(true);
  });

  it("fails for incorrect option", () => {
    expect(gradeQuizSelection("a", "b").passed).toBe(false);
  });
});
