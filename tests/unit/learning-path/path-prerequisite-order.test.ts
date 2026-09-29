import { describe, expect, it } from "vitest";

import { loadConceptsFromFile } from "@/lib/content/curriculum";
import { CANONICAL_MVP_PATH_STEPS } from "@/lib/learning-path/canonical-mvp-steps";
import {
  buildConceptPrerequisiteMap,
  pathStepsRespectPrerequisites,
  topologicalSortPathSteps,
} from "@/lib/learning-path/path-prerequisite-order";

describe("path prerequisite ordering", () => {
  const concepts = loadConceptsFromFile();
  const prerequisiteMap = buildConceptPrerequisiteMap(concepts);

  it("topologically sorts a shuffled subset deterministically", () => {
    const subset = [
      CANONICAL_MVP_PATH_STEPS[1]!,
      CANONICAL_MVP_PATH_STEPS[0]!,
    ];

    const ordered = topologicalSortPathSteps(subset, prerequisiteMap);
    expect(ordered[0]?.referenceId).toBe("how-websites-work");
    expect(ordered[1]?.referenceId).toBe("your-first-html-page");
    expect(pathStepsRespectPrerequisites(ordered, prerequisiteMap)).toBe(true);
  });
});
