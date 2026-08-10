import { readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

const conceptSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  domain: z.enum(["foundations", "css", "javascript", "integration"]),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string()),
  prerequisites: z.array(z.string()),
});

const conceptsFileSchema = z.object({
  concepts: z.array(conceptSchema),
});

const goalTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  matchingKeywords: z.array(z.string().min(1)),
  conceptIds: z.array(z.string().min(1)),
});

const goalTemplatesFileSchema = z.object({
  goalTemplates: z.array(goalTemplateSchema),
});

export type ConceptRecord = z.infer<typeof conceptSchema>;
export type GoalTemplateRecord = z.infer<typeof goalTemplateSchema>;

export type CurriculumData = {
  concepts: ConceptRecord[];
  goalTemplates: GoalTemplateRecord[];
};

const CONTENT_DIR = join(process.cwd(), "content");

export function loadConceptsFromFile(
  filePath = join(CONTENT_DIR, "concepts.json"),
): ConceptRecord[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  return conceptsFileSchema.parse(raw).concepts;
}

export function loadGoalTemplatesFromFile(
  filePath = join(CONTENT_DIR, "goal-templates.json"),
): GoalTemplateRecord[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  return goalTemplatesFileSchema.parse(raw).goalTemplates;
}

export function loadCurriculum(): CurriculumData {
  return {
    concepts: loadConceptsFromFile(),
    goalTemplates: loadGoalTemplatesFromFile(),
  };
}

export function validateConceptGraph(concepts: ConceptRecord[]): {
  conceptIds: Set<string>;
  edges: Array<{ conceptId: string; prerequisiteId: string }>;
} {
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const edges: Array<{ conceptId: string; prerequisiteId: string }> = [];

  if (concepts.length !== 24) {
    throw new Error(`Expected 24 concepts, found ${concepts.length}`);
  }

  const seenIds = new Set<string>();
  for (const concept of concepts) {
    if (seenIds.has(concept.id)) {
      throw new Error(`Duplicate concept id: ${concept.id}`);
    }
    seenIds.add(concept.id);

    for (const prerequisiteId of concept.prerequisites) {
      if (!conceptIds.has(prerequisiteId)) {
        throw new Error(
          `Concept ${concept.id} references unknown prerequisite ${prerequisiteId}`,
        );
      }
      if (prerequisiteId === concept.id) {
        throw new Error(`Concept ${concept.id} cannot prerequisite itself`);
      }
      edges.push({ conceptId: concept.id, prerequisiteId });
    }
  }

  return { conceptIds, edges };
}

export function detectCycle(
  conceptIds: Iterable<string>,
  edges: Array<{ conceptId: string; prerequisiteId: string }>,
): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const id of conceptIds) {
    adjacency.set(id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.prerequisiteId)?.push(edge.conceptId);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (node: string, path: string[]): string[] | null => {
    if (visited.has(node)) {
      return null;
    }
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      return path.slice(cycleStart).concat(node);
    }

    visiting.add(node);
    path.push(node);

    for (const next of adjacency.get(node) ?? []) {
      const cycle = visit(next, path);
      if (cycle) {
        return cycle;
      }
    }

    path.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  for (const id of conceptIds) {
    const cycle = visit(id, []);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}

export function validateGoalTemplates(
  goalTemplates: GoalTemplateRecord[],
  conceptIds: Set<string>,
): void {
  if (goalTemplates.length !== 5) {
    throw new Error(`Expected 5 goal templates, found ${goalTemplates.length}`);
  }

  const seenTemplateIds = new Set<string>();
  for (const template of goalTemplates) {
    if (seenTemplateIds.has(template.id)) {
      throw new Error(`Duplicate goal template id: ${template.id}`);
    }
    seenTemplateIds.add(template.id);

    if (template.matchingKeywords.length === 0) {
      throw new Error(`Goal template ${template.id} requires matching keywords`);
    }

    if (template.conceptIds.length === 0) {
      throw new Error(`Goal template ${template.id} requires conceptIds`);
    }

    const uniqueConceptIds = new Set(template.conceptIds);
    if (uniqueConceptIds.size !== template.conceptIds.length) {
      throw new Error(`Goal template ${template.id} has duplicate conceptIds`);
    }

    for (const conceptId of template.conceptIds) {
      if (!conceptIds.has(conceptId)) {
        throw new Error(
          `Goal template ${template.id} references unknown concept ${conceptId}`,
        );
      }
    }
  }
}

export function validateCurriculumIntegrity(data: CurriculumData): void {
  const { conceptIds, edges } = validateConceptGraph(data.concepts);
  const cycle = detectCycle(conceptIds, edges);
  if (cycle) {
    throw new Error(`Concept graph cycle detected: ${cycle.join(" -> ")}`);
  }
  validateGoalTemplates(data.goalTemplates, conceptIds);
}
