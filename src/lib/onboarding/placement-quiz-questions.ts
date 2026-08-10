import type { PlacementQuizQuestion } from "@/lib/onboarding/types";

/** Curated placement quiz — deterministic, P1-owned (TASK-202). */
export const PLACEMENT_QUIZ_QUESTIONS: PlacementQuizQuestion[] = [
  {
    id: "placement-q1-html-structure",
    prompt: "What is the main purpose of HTML on a web page?",
    domain: "html",
    options: [
      { id: "placement-q1-a", label: "Define the structure and content of the page" },
      { id: "placement-q1-b", label: "Style colors, fonts, and layout" },
      { id: "placement-q1-c", label: "Run interactive logic in the browser" },
      { id: "placement-q1-d", label: "Store user data in a database" },
    ],
    correctOptionId: "placement-q1-a",
  },
  {
    id: "placement-q2-html-links",
    prompt: "Which HTML element creates a clickable link to another page?",
    domain: "html",
    options: [
      { id: "placement-q2-a", label: "<link>" },
      { id: "placement-q2-b", label: "<a>" },
      { id: "placement-q2-c", label: "<button>" },
      { id: "placement-q2-d", label: "<nav>" },
    ],
    correctOptionId: "placement-q2-b",
  },
  {
    id: "placement-q3-css-color",
    prompt: "Which CSS property changes the color of text?",
    domain: "css",
    options: [
      { id: "placement-q3-a", label: "background-color" },
      { id: "placement-q3-b", label: "font-size" },
      { id: "placement-q3-c", label: "color" },
      { id: "placement-q3-d", label: "margin" },
    ],
    correctOptionId: "placement-q3-c",
  },
  {
    id: "placement-q4-css-flexbox",
    prompt: "What is Flexbox mainly used for in CSS?",
    domain: "css",
    options: [
      { id: "placement-q4-a", label: "Arranging items in a flexible row or column layout" },
      { id: "placement-q4-b", label: "Adding animations to buttons" },
      { id: "placement-q4-c", label: "Connecting to an API" },
      { id: "placement-q4-d", label: "Creating database tables" },
    ],
    correctOptionId: "placement-q4-a",
  },
  {
    id: "placement-q5-js-variables",
    prompt: "In JavaScript, what does a variable do?",
    domain: "javascript",
    options: [
      { id: "placement-q5-a", label: "Stores a value that can be used later in code" },
      { id: "placement-q5-b", label: "Styles an HTML element" },
      { id: "placement-q5-c", label: "Defines the page title in HTML" },
      { id: "placement-q5-d", label: "Encrypts passwords automatically" },
    ],
    correctOptionId: "placement-q5-a",
  },
];
