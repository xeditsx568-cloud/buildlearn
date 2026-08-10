import type { ExperienceLevel, MockPathStep } from "@/lib/onboarding/types";

export const GOAL_MIN_LENGTH = 10;
export const GOAL_MAX_LENGTH = 500;

export const EXAMPLE_GOAL_CHIPS = [
  "A portfolio site",
  "A bakery landing page",
  "A blog",
] as const;

export const ONBOARDING_STEPS = [
  { id: "goal", path: "/onboarding/goal", label: "Goal" },
  { id: "experience", path: "/onboarding/experience", label: "Experience" },
  { id: "quiz", path: "/onboarding/quiz", label: "Quiz" },
  { id: "path", path: "/onboarding/path", label: "Your path" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

export const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "beginner",
    title: "Complete beginner",
    description: "Never written code",
  },
  {
    value: "some_exposure",
    title: "Some exposure",
    description: "Tried tutorials or snippets",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Built small projects before",
  },
];

/** Stub path preview data — not AI-generated (TASK-201). */
export const MOCK_PATH_STEPS: MockPathStep[] = [
  { order: 1, title: "How Websites Work", type: "lesson" },
  { order: 2, title: "Your First HTML Page", type: "lesson" },
  { order: 3, title: "HTML Structure", type: "lesson" },
  { order: 4, title: "HTML Elements & Attributes", type: "lesson" },
  { order: 5, title: "CSS Syntax & Selectors", type: "lesson" },
  { order: 6, title: "The Box Model", type: "lesson" },
  { order: 7, title: "Flexbox Layout", type: "lesson" },
  { order: 8, title: "Responsive Design", type: "lesson" },
  { order: 9, title: "JavaScript Variables", type: "lesson" },
  { order: 10, title: "DOM Manipulation", type: "lesson" },
  { order: 11, title: "Events & Interactivity", type: "lesson" },
  { order: 12, title: "Profile Card Challenge", type: "challenge" },
  { order: 13, title: "Project Milestone 1", type: "milestone" },
];

export const ONBOARDING_STORAGE_KEY = "buildlearn-onboarding";

export const ONBOARDING_COMPLETION_ROUTE = "/roadmap";

/** Simulated path generation delay for loading UI (ms). */
export const PATH_LOADING_DELAY_MS = 1200;
