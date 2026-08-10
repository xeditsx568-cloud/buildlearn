import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { QuizShellScreen } from "@/components/onboarding/quiz-shell-screen";

vi.mock("@/components/onboarding/onboarding-provider", () => ({
  useOnboarding: () => ({
    hydrated: true,
    goalText: "",
    experienceLevel: null,
    quizSkipped: false,
    setGoalText: vi.fn(),
    setExperienceLevel: vi.fn(),
    markQuizSkipped: vi.fn(),
  }),
}));

describe("quiz shell navigation", () => {
  it("provides skip navigation to /onboarding/path", () => {
    const html = renderToStaticMarkup(<QuizShellScreen />);

    expect(html).toContain("I&#x27;m not sure — skip quiz");
    expect(html).toContain('href="/onboarding/path"');
    expect(html).toContain("Optional placement quiz");
  });
});
