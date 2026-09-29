import type { ConceptRecord } from "@/lib/content/curriculum";
import type { CanonicalPathStepDefinition } from "@/lib/learning-path/canonical-mvp-steps";

export const MVP_REQUIRED_FIRST_LESSON_REFERENCE_ID = "how-websites-work";

export function buildConceptPrerequisiteMap(
  concepts: ConceptRecord[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const concept of concepts) {
    map.set(concept.id, [...concept.prerequisites]);
  }
  return map;
}

/** True when every prerequisite of each step's concept appears in an earlier step. */
export function pathStepsRespectPrerequisites(
  steps: Array<{ primaryConceptId: string }>,
  prerequisiteMap: Map<string, string[]>,
): boolean {
  const seenConcepts = new Set<string>();

  for (const step of steps) {
    const prerequisites = prerequisiteMap.get(step.primaryConceptId) ?? [];
    for (const prerequisiteId of prerequisites) {
      if (!seenConcepts.has(prerequisiteId)) {
        return false;
      }
    }
    seenConcepts.add(step.primaryConceptId);
  }

  return true;
}

/**
 * Deterministic topological ordering of path steps by concept prerequisites.
 * Tie-break: lower canonical orderIndex first.
 */
export function topologicalSortPathSteps(
  steps: CanonicalPathStepDefinition[],
  prerequisiteMap: Map<string, string[]>,
): CanonicalPathStepDefinition[] {
  const byConceptId = new Map(
    steps.map((step) => [step.primaryConceptId, step]),
  );
  const conceptIds = new Set(byConceptId.keys());

  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const conceptId of conceptIds) {
    inDegree.set(conceptId, 0);
    dependents.set(conceptId, []);
  }

  for (const conceptId of conceptIds) {
    const prerequisites = prerequisiteMap.get(conceptId) ?? [];
    for (const prerequisiteId of prerequisites) {
      if (!conceptIds.has(prerequisiteId)) {
        continue;
      }
      inDegree.set(conceptId, (inDegree.get(conceptId) ?? 0) + 1);
      dependents.get(prerequisiteId)?.push(conceptId);
    }
  }

  const ready = [...conceptIds]
    .filter((id) => (inDegree.get(id) ?? 0) === 0)
    .sort(
      (a, b) =>
        (byConceptId.get(a)?.orderIndex ?? 0) -
        (byConceptId.get(b)?.orderIndex ?? 0),
    );

  const ordered: CanonicalPathStepDefinition[] = [];

  while (ready.length > 0) {
    ready.sort(
      (a, b) =>
        (byConceptId.get(a)?.orderIndex ?? 0) -
        (byConceptId.get(b)?.orderIndex ?? 0),
    );
    const conceptId = ready.shift()!;
    const step = byConceptId.get(conceptId);
    if (step) {
      ordered.push(step);
    }

    for (const dependentId of dependents.get(conceptId) ?? []) {
      const nextDegree = (inDegree.get(dependentId) ?? 0) - 1;
      inDegree.set(dependentId, nextDegree);
      if (nextDegree === 0) {
        ready.push(dependentId);
      }
    }
  }

  if (ordered.length !== steps.length) {
    throw new Error(
      "Cannot order path steps: prerequisite cycle or missing concepts in subset",
    );
  }

  return ordered.map((step, index) => ({ ...step, orderIndex: index }));
}

/** Drop steps whose prerequisites are not satisfied by earlier steps in the list. */
export function pruneStepsWithUnmetPrerequisites(
  steps: CanonicalPathStepDefinition[],
  prerequisiteMap: Map<string, string[]>,
): CanonicalPathStepDefinition[] {
  const kept: CanonicalPathStepDefinition[] = [];
  const seenConcepts = new Set<string>();

  for (const step of steps) {
    const prerequisites = prerequisiteMap.get(step.primaryConceptId) ?? [];
    const satisfied = prerequisites.every((id) => seenConcepts.has(id));
    if (!satisfied) {
      continue;
    }
    kept.push(step);
    seenConcepts.add(step.primaryConceptId);
  }

  return kept.map((step, index) => ({ ...step, orderIndex: index }));
}
