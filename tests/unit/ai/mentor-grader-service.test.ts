import { describe, expect, it } from "vitest";

import {
  gradeExerciseBlock,
  gradeInteractBlock,
  gradeQuizSelection,
} from "@/lib/grading/html-lesson-graders";
import type { LessonBlock } from "@/lib/schemas/lesson";
import { gradeLessonBlockForMentor } from "@/server/services/mentor-grader-service";

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

const interactBlock: LessonBlock = {
  type: "interact",
  instructions: "Edit the paragraph.",
  language: "html",
  starterCode: INTERACT_STARTER,
};

const exerciseBlock: LessonBlock = {
  type: "exercise",
  title: "Label the page parts",
  instructions: "Add comments.",
  language: "html",
  starterCode: "<html></html>",
};

const quizBlock: LessonBlock = {
  type: "quiz",
  question: "Q?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  correctOptionId: "b",
};

describe("gradeLessonBlockForMentor parity", () => {
  it("matches gradeInteractBlock", () => {
    const edited = INTERACT_STARTER.replace(
      "We help customers with quality products and friendly service.",
      "Custom text.",
    );
    const direct = gradeInteractBlock(edited, INTERACT_STARTER);
    const viaService = gradeLessonBlockForMentor({
      block: interactBlock,
      learnerCode: edited,
    });
    expect(viaService).toEqual(direct);
  });

  it("matches gradeExerciseBlock", () => {
    const code = `<!-- doc -->
<html><head></head><body></body></html>`;
    expect(gradeLessonBlockForMentor({ block: exerciseBlock, learnerCode: code })).toEqual(
      gradeExerciseBlock(code),
    );
  });

  it("matches gradeQuizSelection", () => {
    expect(
      gradeLessonBlockForMentor({
        block: quizBlock,
        selectedOptionId: "b",
      }),
    ).toEqual(gradeQuizSelection("b", "b"));
  });
});
