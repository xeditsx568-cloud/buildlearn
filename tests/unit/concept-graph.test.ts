import { describe, expect, it } from "vitest";

import {
  detectCycle,
  loadConceptsFromFile,
  loadCurriculum,
  loadGoalTemplatesFromFile,
  validateConceptGraph,
  validateCurriculumIntegrity,
  validateGoalTemplates,
} from "@/lib/content/curriculum";

describe("concept graph curriculum", () => {
  it("loads exactly 24 concepts from content/concepts.json", () => {
    const concepts = loadConceptsFromFile();
    expect(concepts).toHaveLength(24);
  });

  it("loads exactly 5 goal templates from content/goal-templates.json", () => {
    const goalTemplates = loadGoalTemplatesFromFile();
    expect(goalTemplates).toHaveLength(5);
  });

  it("uses canonical concept ids from PRODUCT_REQUIREMENTS.md section 4", () => {
    const concepts = loadConceptsFromFile();
    expect(concepts.map((concept) => concept.id).sort()).toEqual(
      [
        "combining-html-css-js",
        "css-box-model",
        "css-colors-typography",
        "css-flexbox",
        "css-grid-intro",
        "css-responsive",
        "css-selectors",
        "css-syntax",
        "debugging-basics",
        "how-web-works",
        "html-attributes",
        "html-document-structure",
        "html-elements",
        "html-forms",
        "html-semantics",
        "js-arrays",
        "js-conditionals",
        "js-dom-manipulation",
        "js-dom-selection",
        "js-events",
        "js-functions",
        "js-loops",
        "js-variables-types",
        "project-structure",
      ].sort(),
    );
  });

  it("has no cycles in the prerequisite DAG", () => {
    const concepts = loadConceptsFromFile();
    const { conceptIds, edges } = validateConceptGraph(concepts);
    expect(detectCycle(conceptIds, edges)).toBeNull();
  });

  it("resolves all prerequisite ids to known concepts", () => {
    const concepts = loadConceptsFromFile();
    expect(() => validateConceptGraph(concepts)).not.toThrow();
  });

  it("validates goal template concept references and counts", () => {
    const concepts = loadConceptsFromFile();
    const goalTemplates = loadGoalTemplatesFromFile();
    const { conceptIds } = validateConceptGraph(concepts);
    expect(() => validateGoalTemplates(goalTemplates, conceptIds)).not.toThrow();
  });

  it("passes full curriculum integrity checks", () => {
    expect(() => validateCurriculumIntegrity(loadCurriculum())).not.toThrow();
  });

  it("includes frozen goal template ids aligned with product examples", () => {
    const goalTemplates = loadGoalTemplatesFromFile();
    expect(goalTemplates.map((template) => template.id).sort()).toEqual(
      [
        "bakery-landing-page",
        "business-website",
        "hobby-creator-site",
        "personal-blog",
        "portfolio-site",
      ].sort(),
    );
  });

  it("shares core concepts across multiple goal templates", () => {
    const goalTemplates = loadGoalTemplatesFromFile();
    const templatesWithFlexbox = goalTemplates.filter((template) =>
      template.conceptIds.includes("css-flexbox"),
    );
    expect(templatesWithFlexbox.length).toBeGreaterThanOrEqual(4);
  });
});
