import { describe, expect, it } from "vitest";

import {
  LESSON_BLOCK_TYPES,
  lessonBlockSchema,
  lessonSchema,
  loadLessonFromFile,
  parseLesson,
} from "@/lib/schemas/lesson";

describe("lesson schema", () => {
  it("accepts a valid lesson with all six block types", () => {
    const lesson = parseLesson({
      id: "sample-lesson",
      title: "Sample Lesson",
      estimatedMinutes: 10,
      version: 1,
      conceptIds: ["how-web-works"],
      blocks: [
        {
          type: "objective",
          title: "Goals",
          objectives: ["Learn something useful"],
        },
        {
          type: "explain",
          title: "Concept",
          body: "Explanation text.",
        },
        {
          type: "interact",
          instructions: "Try editing the paragraph.",
          language: "html",
          starterCode: "<p>Hello</p>",
        },
        {
          type: "exercise",
          title: "Practice",
          instructions: "Complete the task.",
          language: "html",
          starterCode: "<p>Start here</p>",
        },
        {
          type: "quiz",
          question: "What is HTML?",
          options: [
            { id: "a", label: "Structure language" },
            { id: "b", label: "Database engine" },
          ],
          correctOptionId: "a",
        },
        {
          type: "bridge",
          body: "Next up: more HTML.",
          nextLessonId: "your-first-html-page",
          nextLessonTitle: "Your First HTML Page",
        },
      ],
    });

    expect(lesson.blocks).toHaveLength(6);
    expect(lesson.blocks.map((block) => block.type)).toEqual(LESSON_BLOCK_TYPES);
  });

  it("rejects an invalid lesson missing required fields", () => {
    expect(() =>
      parseLesson({
        id: "broken-lesson",
        title: "",
        estimatedMinutes: 0,
        version: 0,
        conceptIds: [],
        blocks: [],
      }),
    ).toThrow();
  });

  it("rejects unsupported block types", () => {
    expect(() =>
      lessonBlockSchema.parse({
        type: "video",
        url: "https://example.com/video.mp4",
      }),
    ).toThrow();
  });

  it("rejects quiz blocks with an unknown correctOptionId", () => {
    expect(() =>
      lessonBlockSchema.parse({
        type: "quiz",
        question: "Pick one",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        correctOptionId: "c",
      }),
    ).toThrow();
  });

  it("validates each supported block type independently", () => {
    expect(
      lessonBlockSchema.parse({
        type: "objective",
        title: "Goals",
        objectives: ["One"],
      }).type,
    ).toBe("objective");

    expect(
      lessonBlockSchema.parse({
        type: "explain",
        body: "Body copy",
      }).type,
    ).toBe("explain");

    expect(
      lessonBlockSchema.parse({
        type: "interact",
        instructions: "Edit this",
        starterCode: "<p>Hi</p>",
      }).type,
    ).toBe("interact");

    expect(
      lessonBlockSchema.parse({
        type: "exercise",
        title: "Exercise",
        instructions: "Do the thing",
        language: "html",
        starterCode: "<p>Start</p>",
      }).type,
    ).toBe("exercise");

    expect(
      lessonBlockSchema.parse({
        type: "quiz",
        question: "Question?",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        correctOptionId: "a",
      }).type,
    ).toBe("quiz");

    expect(
      lessonBlockSchema.parse({
        type: "bridge",
        body: "Bridge copy",
      }).type,
    ).toBe("bridge");
  });

  it("validates Lesson 1 JSON successfully", () => {
    const lesson = loadLessonFromFile("01-how-websites-work.json");

    expect(lesson.id).toBe("how-websites-work");
    expect(lesson.title).toBe("How Websites Work");
    expect(lesson.conceptIds).toEqual(["how-web-works"]);
    expect(lesson.blocks.map((block) => block.type)).toEqual(LESSON_BLOCK_TYPES);
    expect(lesson.estimatedMinutes).toBeGreaterThan(0);
    expect(lesson.version).toBeGreaterThan(0);
  });
});
