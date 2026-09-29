import type { GraderResult } from "@/lib/lesson-player/contracts";

const STARTER_PARAGRAPH =
  "We help customers with quality products and friendly service.";

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

/** L1 interact: learner changed the starter paragraph text. */
export function gradeInteractBlock(
  submittedHtml: string,
  starterCode: string,
): GraderResult {
  const starterNormalized = normalizeHtml(starterCode);
  const submittedNormalized = normalizeHtml(submittedHtml);

  if (submittedNormalized === starterNormalized) {
    return {
      passed: false,
      message: "Update the paragraph text inside the <p> tag to describe your site.",
    };
  }

  const paragraphMatch = submittedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!paragraphMatch?.[1]?.trim()) {
    return {
      passed: false,
      message: "Include meaningful text inside your paragraph element.",
    };
  }

  const paragraphText = paragraphMatch[1].replace(/<[^>]+>/g, "").trim();
  if (paragraphText === STARTER_PARAGRAPH) {
    return {
      passed: false,
      message: "Change the paragraph text from the starter sentence.",
    };
  }

  return { passed: true, message: "Nice edit — your paragraph is updated." };
}

/** L1 exercise: HTML comments before html, head, and body openings. */
export function gradeExerciseBlock(submittedHtml: string): GraderResult {
  const html = submittedHtml.toLowerCase();

  const hasHtmlComment = /<!--[\s\S]*?-->\s*<html\b/.test(html);
  const hasHeadComment = /<!--[\s\S]*?-->\s*<head\b/.test(html);
  const hasBodyComment = /<!--[\s\S]*?-->\s*<body\b/.test(html);

  if (!hasHtmlComment || !hasHeadComment || !hasBodyComment) {
    return {
      passed: false,
      message:
        "Add one <!-- comment --> immediately above the <html>, <head>, and <body> tags.",
    };
  }

  return { passed: true, message: "Comments label each major section correctly." };
}

export function gradeQuizSelection(
  selectedOptionId: string,
  correctOptionId: string,
): GraderResult {
  if (selectedOptionId !== correctOptionId) {
    return {
      passed: false,
      message: "That answer is not correct yet. Read the explanation and try again.",
    };
  }

  return { passed: true, message: "Correct!" };
}
