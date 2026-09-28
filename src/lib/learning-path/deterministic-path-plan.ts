import type { ExperienceLevel } from "@prisma/client";

import type { GoalTemplateRecord } from "@/lib/content/curriculum";
import {
  CANONICAL_MVP_PATH_STEPS,
  MVP_PATH_SECTIONS,
  type CanonicalPathStepDefinition,
} from "@/lib/learning-path/canonical-mvp-steps";
import { matchGoalTemplate } from "@/lib/learning-path/goal-template-matcher";

export type PathPlanStep = {
  orderIndex: number;
  stepType: CanonicalPathStepDefinition["stepType"];
  referenceId: string;
  displayTitle: string;
  sectionId: string;
  status: "available" | "locked";
};

export type DeterministicPathPlan = {
  goalTemplateId: string;
  goalTemplateName: string;
  goalDisplayTitle: string;
  steps: PathPlanStep[];
  metadata: {
    goal_display_title: string;
    goal_template_id: string;
    goal_template_name: string;
    sections: Array<{
      id: string;
      title: string;
      start_order: number;
      end_order: number;
    }>;
    generator: "deterministic-v1";
  };
};

function filterStepsForTemplate(
  template: GoalTemplateRecord,
  experienceLevel: ExperienceLevel | null,
): CanonicalPathStepDefinition[] {
  const allowedConcepts = new Set(template.conceptIds);

  let steps = CANONICAL_MVP_PATH_STEPS.filter((step) =>
    allowedConcepts.has(step.primaryConceptId),
  );

  if (steps.length === 0) {
    steps = [CANONICAL_MVP_PATH_STEPS[0]!];
  }

  // Experience-based trimming defers placement server persistence (ADR-021).
  if (experienceLevel === "intermediate" && steps.length > 4) {
    steps = steps.slice(2);
  } else if (experienceLevel === "some_exposure" && steps.length > 6) {
    steps = steps.slice(1);
  }

  return steps.map((step, index) => ({
    ...step,
    orderIndex: index,
  }));
}

export function buildDeterministicPathPlan(input: {
  learningGoalText: string;
  experienceLevel: ExperienceLevel | null;
  goalTemplates: GoalTemplateRecord[];
}): DeterministicPathPlan {
  const template = matchGoalTemplate(input.learningGoalText, input.goalTemplates);
  const selectedSteps = filterStepsForTemplate(
    template,
    input.experienceLevel,
  );

  const goalDisplayTitle =
    input.learningGoalText.trim() || template.name;

  const steps: PathPlanStep[] = selectedSteps.map((step, index) => ({
    orderIndex: index,
    stepType: step.stepType,
    referenceId: step.referenceId,
    displayTitle: step.displayTitle,
    sectionId: step.sectionId,
    status: index === 0 ? "available" : "locked",
  }));

  const sectionIds = new Set(selectedSteps.map((s) => s.sectionId));
  const sections = MVP_PATH_SECTIONS.filter((section) =>
    sectionIds.has(section.id),
  ).map((section) => ({
    id: section.id,
    title: section.title,
    start_order: section.startOrder,
    end_order: section.endOrder,
  }));

  return {
    goalTemplateId: template.id,
    goalTemplateName: template.name,
    goalDisplayTitle,
    steps,
    metadata: {
      goal_display_title: goalDisplayTitle,
      goal_template_id: template.id,
      goal_template_name: template.name,
      sections,
      generator: "deterministic-v1",
    },
  };
}
