import type { LearningPathStepType } from "@prisma/client";

/** Planned MVP path step before full curriculum exists in DB (ADR-022 slice). */
export type CanonicalPathStepDefinition = {
  orderIndex: number;
  stepType: LearningPathStepType;
  referenceId: string;
  displayTitle: string;
  sectionId: string;
  primaryConceptId: string;
};

/**
 * Deterministic first-MVP journey aligned with onboarding mock preview and
 * PRODUCT_REQUIREMENTS.md lesson/challenge ordering.
 */
export const CANONICAL_MVP_PATH_STEPS: CanonicalPathStepDefinition[] = [
  {
    orderIndex: 0,
    stepType: "lesson",
    referenceId: "how-websites-work",
    displayTitle: "How Websites Work",
    sectionId: "foundations",
    primaryConceptId: "how-web-works",
  },
  {
    orderIndex: 1,
    stepType: "lesson",
    referenceId: "your-first-html-page",
    displayTitle: "Your First HTML Page",
    sectionId: "html-basics",
    primaryConceptId: "html-document-structure",
  },
  {
    orderIndex: 2,
    stepType: "lesson",
    referenceId: "html-structure-semantics",
    displayTitle: "HTML Structure & Semantics",
    sectionId: "html-basics",
    primaryConceptId: "html-semantics",
  },
  {
    orderIndex: 3,
    stepType: "lesson",
    referenceId: "links-images-forms",
    displayTitle: "Links, Images & Forms",
    sectionId: "html-basics",
    primaryConceptId: "html-forms",
  },
  {
    orderIndex: 4,
    stepType: "lesson",
    referenceId: "css-basics-selectors",
    displayTitle: "CSS Basics & Selectors",
    sectionId: "css-basics",
    primaryConceptId: "css-selectors",
  },
  {
    orderIndex: 5,
    stepType: "lesson",
    referenceId: "box-model-spacing",
    displayTitle: "Box Model & Spacing",
    sectionId: "css-basics",
    primaryConceptId: "css-box-model",
  },
  {
    orderIndex: 6,
    stepType: "lesson",
    referenceId: "layout-flexbox",
    displayTitle: "Layout with Flexbox",
    sectionId: "css-basics",
    primaryConceptId: "css-flexbox",
  },
  {
    orderIndex: 7,
    stepType: "lesson",
    referenceId: "responsive-design",
    displayTitle: "Responsive Design",
    sectionId: "css-basics",
    primaryConceptId: "css-responsive",
  },
  {
    orderIndex: 8,
    stepType: "lesson",
    referenceId: "javascript-basics",
    displayTitle: "JavaScript Basics",
    sectionId: "javascript-basics",
    primaryConceptId: "js-variables-types",
  },
  {
    orderIndex: 9,
    stepType: "lesson",
    referenceId: "functions-and-logic",
    displayTitle: "Functions & Logic",
    sectionId: "javascript-basics",
    primaryConceptId: "js-functions",
  },
  {
    orderIndex: 10,
    stepType: "lesson",
    referenceId: "dom-manipulation",
    displayTitle: "DOM Manipulation",
    sectionId: "javascript-basics",
    primaryConceptId: "js-dom-manipulation",
  },
  {
    orderIndex: 11,
    stepType: "lesson",
    referenceId: "events-interactivity",
    displayTitle: "Events & Interactivity",
    sectionId: "javascript-basics",
    primaryConceptId: "js-events",
  },
  {
    orderIndex: 12,
    stepType: "challenge",
    referenceId: "profile-card-challenge",
    displayTitle: "Profile Card Challenge",
    sectionId: "practice",
    primaryConceptId: "html-elements",
  },
  {
    orderIndex: 13,
    stepType: "project_milestone",
    referenceId: "project-milestone-1",
    displayTitle: "Project Milestone 1",
    sectionId: "project",
    primaryConceptId: "project-structure",
  },
];

export const MVP_PATH_SECTIONS = [
  { id: "foundations", title: "Foundations", startOrder: 0, endOrder: 0 },
  { id: "html-basics", title: "HTML Basics", startOrder: 1, endOrder: 3 },
  { id: "css-basics", title: "CSS Basics", startOrder: 4, endOrder: 7 },
  {
    id: "javascript-basics",
    title: "JavaScript Basics",
    startOrder: 8,
    endOrder: 11,
  },
  { id: "practice", title: "Practice", startOrder: 12, endOrder: 12 },
  { id: "project", title: "Your Project", startOrder: 13, endOrder: 13 },
] as const;
