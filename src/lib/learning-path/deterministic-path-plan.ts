import type { ExperienceLevel } from "@prisma/client";

import type { ConceptRecord, GoalTemplateRecord } from "@/lib/content/curriculum";
import { loadConceptsFromFile } from "@/lib/content/curriculum";
import {
  CANONICAL_MVP_PATH_STEPS,
  MVP_PATH_SECTIONS,
  type CanonicalPathStepDefinition,
} from "@/lib/learning-path/canonical-mvp-steps";
import { matchGoalTemplate } from "@/lib/learning-path/goal-template-matcher";
import {
  buildConceptPrerequisiteMap,
  MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
  pathStepsRespectPrerequisites,
  pruneStepsWithUnmetPrerequisites,
  topologicalSortPathSteps,
} from "@/lib/learning-path/path-prerequisite-order";

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

const REQUIRED_FIRST_STEP = CANONICAL_MVP_PATH_STEPS[0]!;

/** Minimum steps for a non-trivial MVP-M1 journey (founder B4). */
export const MVP_MIN_MEANINGFUL_PATH_STEPS = 3;

function dedupeStepsByReferenceId(
  steps: CanonicalPathStepDefinition[],
): CanonicalPathStepDefinition[] {
  const seen = new Set<string>();
  const deduped: CanonicalPathStepDefinition[] = [];

  for (const step of steps) {
    if (seen.has(step.referenceId)) {
      continue;
    }
    seen.add(step.referenceId);
    deduped.push(step);
  }

  return deduped;
}

function expandWithPrerequisiteSteps(
  steps: CanonicalPathStepDefinition[],
  prerequisiteMap: Map<string, string[]>,
): CanonicalPathStepDefinition[] {
  const byConceptId = new Map(
    CANONICAL_MVP_PATH_STEPS.map((step) => [step.primaryConceptId, step]),
  );
  const selectedConcepts = new Set(steps.map((step) => step.primaryConceptId));
  const queue = [...selectedConcepts];
  const expandedConcepts = new Set(selectedConcepts);

  while (queue.length > 0) {
    const conceptId = queue.shift()!;
    for (const prerequisiteId of prerequisiteMap.get(conceptId) ?? []) {
      if (expandedConcepts.has(prerequisiteId)) {
        continue;
      }
      expandedConcepts.add(prerequisiteId);
      queue.push(prerequisiteId);
    }
  }

  const expandedSteps = [...expandedConcepts]
    .map((conceptId) => byConceptId.get(conceptId))
    .filter((step): step is CanonicalPathStepDefinition => step !== undefined);

  return dedupeStepsByReferenceId(expandedSteps);
}

function pinRequiredFirstLesson(
  steps: CanonicalPathStepDefinition[],
): CanonicalPathStepDefinition[] {
  const deduped = dedupeStepsByReferenceId(steps);
  const requiredFirst = deduped.find(
    (step) => step.referenceId === MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
  );
  const withoutFirst = deduped.filter(
    (step) => step.referenceId !== MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
  );
  const pinned = requiredFirst
    ? [requiredFirst, ...withoutFirst]
    : [REQUIRED_FIRST_STEP, ...withoutFirst];

  return pinned.map((step, index) => ({ ...step, orderIndex: index }));
}

/**
 * Prerequisite-safe experience personalization: trim only from the path end.
 * Never removes the required first lesson or mid-path prerequisites.
 */
function applyExperiencePersonalization(
  steps: CanonicalPathStepDefinition[],
  experienceLevel: ExperienceLevel | null,
): CanonicalPathStepDefinition[] {
  if (experienceLevel === "beginner" || experienceLevel === null) {
    return steps;
  }

  let dropFromEnd = 0;
  if (experienceLevel === "some_exposure") {
    dropFromEnd = 1;
  } else if (experienceLevel === "intermediate") {
    dropFromEnd = 2;
  }

  if (dropFromEnd === 0 || steps.length <= MVP_MIN_MEANINGFUL_PATH_STEPS) {
    return steps;
  }

  const maxDrop = steps.length - MVP_MIN_MEANINGFUL_PATH_STEPS;
  const actualDrop = Math.min(dropFromEnd, maxDrop);
  if (actualDrop <= 0) {
    return steps;
  }

  return steps.slice(0, steps.length - actualDrop).map((step, index) => ({
    ...step,
    orderIndex: index,
  }));
}

function computeSectionMetadata(steps: CanonicalPathStepDefinition[]) {
  const sectionIds = new Set(steps.map((s) => s.sectionId));
  return MVP_PATH_SECTIONS.filter((section) => sectionIds.has(section.id)).map(
    (section) => {
      const indices = steps
        .map((step, index) =>
          step.sectionId === section.id ? index : null,
        )
        .filter((index): index is number => index !== null);

      return {
        id: section.id,
        title: section.title,
        start_order: indices.length > 0 ? Math.min(...indices) : section.startOrder,
        end_order: indices.length > 0 ? Math.max(...indices) : section.endOrder,
      };
    },
  );
}

export function filterStepsForTemplate(
  template: GoalTemplateRecord,
  experienceLevel: ExperienceLevel | null,
  concepts: ConceptRecord[],
): CanonicalPathStepDefinition[] {
  const prerequisiteMap = buildConceptPrerequisiteMap(concepts);
  const allowedConcepts = new Set(template.conceptIds);

  let steps = CANONICAL_MVP_PATH_STEPS.filter((step) =>
    allowedConcepts.has(step.primaryConceptId),
  );

  if (steps.length === 0) {
    steps = [REQUIRED_FIRST_STEP];
  }

  steps = expandWithPrerequisiteSteps(steps, prerequisiteMap);
  steps = topologicalSortPathSteps(steps, prerequisiteMap);

  const hasRequiredFirst = steps.some(
    (step) => step.referenceId === MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID,
  );
  if (!hasRequiredFirst) {
    steps = dedupeStepsByReferenceId([REQUIRED_FIRST_STEP, ...steps]);
    steps = topologicalSortPathSteps(steps, prerequisiteMap);
  }

  steps = pruneStepsWithUnmetPrerequisites(steps, prerequisiteMap);
  steps = pinRequiredFirstLesson(steps);
  steps = applyExperiencePersonalization(steps, experienceLevel);
  steps = pinRequiredFirstLesson(steps);

  if (!pathStepsRespectPrerequisites(steps, prerequisiteMap)) {
    throw new Error("Generated path violates concept prerequisite ordering");
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
  concepts?: ConceptRecord[];
}): DeterministicPathPlan {
  const concepts = input.concepts ?? loadConceptsFromFile();
  const template = matchGoalTemplate(input.learningGoalText, input.goalTemplates);
  const selectedSteps = filterStepsForTemplate(
    template,
    input.experienceLevel,
    concepts,
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

  const sections = computeSectionMetadata(selectedSteps);

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
