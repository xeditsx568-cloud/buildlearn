import { describe, expect, it } from "vitest";

import { loadGoalTemplatesFromFile } from "@/lib/content/curriculum";
import { buildDeterministicPathPlan } from "@/lib/learning-path/deterministic-path-plan";
import { matchGoalTemplate } from "@/lib/learning-path/goal-template-matcher";

describe("matchGoalTemplate", () => {
  const templates = loadGoalTemplatesFromFile();

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
});

describe("buildDeterministicPathPlan", () => {
  const templates = loadGoalTemplatesFromFile();

  it("starts with how-websites-work unlocked", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site for my photography business",
      experienceLevel: "beginner",
      goalTemplates: templates,
    });

    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps[0]?.referenceId).toBe("how-websites-work");
    expect(plan.steps[0]?.status).toBe("available");
    expect(plan.steps[1]?.status).toBe("locked");
  });

  it("includes template metadata for roadmap sections", () => {
    const plan = buildDeterministicPathPlan({
      learningGoalText: "A small business website for my company",
      experienceLevel: "beginner",
      goalTemplates: templates,
    });

    expect(plan.metadata.generator).toBe("deterministic-v1");
    expect(plan.metadata.goal_template_id).toBe("business-website");
    expect(plan.metadata.sections.length).toBeGreaterThan(0);
  });

  it("produces shorter paths for intermediate experience", () => {
    const beginner = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site",
      experienceLevel: "beginner",
      goalTemplates: templates,
    });
    const intermediate = buildDeterministicPathPlan({
      learningGoalText: "A portfolio site",
      experienceLevel: "intermediate",
      goalTemplates: templates,
    });

    expect(intermediate.steps.length).toBeLessThan(beginner.steps.length);
  });
});
