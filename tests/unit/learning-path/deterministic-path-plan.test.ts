import { describe, expect, it } from "vitest";

import {
  loadConceptsFromFile,
  loadGoalTemplatesFromFile,
} from "@/lib/content/curriculum";
import { CANONICAL_MVP_PATH_STEPS } from "@/lib/learning-path/canonical-mvp-steps";
import {
  buildDeterministicPathPlan,
  MVP_MIN_MEANINGFUL_PATH_STEPS,
} from "@/lib/learning-path/deterministic-path-plan";
import { matchGoalTemplate } from "@/lib/learning-path/goal-template-matcher";
import {
  buildConceptPrerequisiteMap,
  MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
  pathStepsRespectPrerequisites,
} from "@/lib/learning-path/path-prerequisite-order";

const templates = loadGoalTemplatesFromFile();
const concepts = loadConceptsFromFile();
const prerequisiteMap = buildConceptPrerequisiteMap(concepts);

function expectFirstLessonInvariant(
  plan: ReturnType<typeof buildDeterministicPathPlan>,
) {
  expect(plan.steps.length).toBeGreaterThan(0);
  expect(plan.steps[0]?.referenceId).toBe(MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID);
  expect(plan.steps[0]?.status).toBe("available");
  if (plan.steps.length > 1) {
    expect(plan.steps[1]?.status).toBe("locked");
  }
}

describe("matchGoalTemplate", () => {
  it("matches bakery goals to business website template", () => {
    const match = matchGoalTemplate(
      "I need a bakery landing page for my shop",
      templates,
    );
    expect(match.id).toBe("business-website");
  });

  it("is deterministic for the same input", () => {
    const goal = "Showcase my freelance portfolio and work samples";
    const first = matchGoalTemplate(goal, templates);
    const second = matchGoalTemplate(goal, templates);
    expect(first.id).toBe(second.id);
  });

  it("falls back deterministically when no keywords match", () => {
    const match = matchGoalTemplate("zzzz unknown niche topic qqqq", templates);
    const repeat = matchGoalTemplate("zzzz unknown niche topic qqqq", templates);
    expect(match.id).toBe(repeat.id);
  });
});

const STANDARD_BUSINESS_GOAL =
  "I need a bakery landing page for my shop";

function planForBusinessTemplate(experienceLevel: "beginner" | "some_exposure" | "intermediate") {
  return buildDeterministicPathPlan({
    learningGoalText: STANDARD_BUSINESS_GOAL,
    experienceLevel,
    goalTemplates: templates,
    concepts,
  });
}

function expectMeaningfulPrerequisiteSafePath(
  plan: ReturnType<typeof buildDeterministicPathPlan>,
) {
  expectFirstLessonInvariant(plan);
  expect(plan.steps.length).toBeGreaterThanOrEqual(MVP_MIN_MEANINGFUL_PATH_STEPS);
  expect(plan.metadata.goal_template_id).toBe("business-website");

  const stepConcepts = plan.steps.map((step) => {
    const canonicalStep = CANONICAL_MVP_PATH_STEPS.find(
      (def) => def.referenceId === step.referenceId,
    );
    expect(canonicalStep).toBeDefined();
    return { primaryConceptId: canonicalStep!.primaryConceptId };
  });

  expect(pathStepsRespectPrerequisites(stepConcepts, prerequisiteMap)).toBe(true);
}

describe("buildDeterministicPathPlan", () => {
  it("starts with how-websites-work unlocked for beginner", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site for my photography business",
      experienceLevel: "beginner",
      goalTemplates: templates,
      concepts,
    });

    expectFirstLessonInvariant(plan);
  });

  it("starts with how-websites-work unlocked for some_exposure", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site for my photography business",
      experienceLevel: "some_exposure",
      goalTemplates: templates,
      concepts,
    });

    expectFirstLessonInvariant(plan);
  });

  it("starts with how-websites-work unlocked for intermediate", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site for my photography business",
      experienceLevel: "intermediate",
      goalTemplates: templates,
      concepts,
    });

    expectFirstLessonInvariant(plan);
  });

  it("respects concept prerequisite ordering for every experience level", () => {
    for (const experienceLevel of [
      "beginner",
      "some_exposure",
      "intermediate",
    ] as const) {
      const plan = buildDeterministicPathPlan({
        learningGoalText: "A small business website for my company",
        experienceLevel,
        goalTemplates: templates,
        concepts,
      });

      const stepConcepts = plan.steps.map((step) => {
        const canonicalStep = CANONICAL_MVP_PATH_STEPS.find(
          (def) => def.referenceId === step.referenceId,
        );
        expect(canonicalStep).toBeDefined();
        return { primaryConceptId: canonicalStep!.primaryConceptId };
      });

      expect(
        pathStepsRespectPrerequisites(stepConcepts, prerequisiteMap),
      ).toBe(true);
    }
  });

  it("produces identical plans for identical inputs", () => {
    const input = {
      learningGoalText: "A portfolio site",
      experienceLevel: "beginner" as const,
      goalTemplates: templates,
      concepts,
    };
    const first = buildDeterministicPathPlan(input);
    const second = buildDeterministicPathPlan(input);
    expect(first).toEqual(second);
  });

  it("includes template metadata for roadmap sections", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A small business website for my company",
      experienceLevel: "beginner",
      goalTemplates: templates,
      concepts,
    });

    expect(plan.metadata.generator).toBe("deterministic-v1");
    expect(plan.metadata.goal_template_id).toBe("business-website");
    expect(plan.metadata.sections.length).toBeGreaterThan(0);
  });

  it("produces a meaningful multi-step path for business-website + beginner", () => {
    expectMeaningfulPrerequisiteSafePath(planForBusinessTemplate("beginner"));
  });

  it("produces a meaningful multi-step path for business-website + some_exposure", () => {
    expectMeaningfulPrerequisiteSafePath(planForBusinessTemplate("some_exposure"));
  });

  it("produces a meaningful multi-step path for business-website + intermediate", () => {
    expectMeaningfulPrerequisiteSafePath(planForBusinessTemplate("intermediate"));
  });

  it("may shorten intermediate paths only from the end without breaking prerequisites", () => {
    const beginner = planForBusinessTemplate("beginner");
    const intermediate = planForBusinessTemplate("intermediate");

    expect(intermediate.steps.length).toBeLessThanOrEqual(beginner.steps.length);
    expect(intermediate.steps.length).toBeGreaterThanOrEqual(
      MVP_MIN_MEANINGFUL_PATH_STEPS,
    );
    expect(intermediate.steps[0]?.referenceId).toBe(
      MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
    );
  });
});
