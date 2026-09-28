import type { GoalTemplateRecord } from "@/lib/content/curriculum";

/**
 * Deterministic goal-template match from free-text goal (keyword scoring).
 * Ties break by template id lexicographic order for stable output.
 */
export function matchGoalTemplate(
  learningGoalText: string,
  templates: GoalTemplateRecord[],
): GoalTemplateRecord {
  if (templates.length === 0) {
    throw new Error("At least one goal template is required");
  }

  const normalizedGoal = learningGoalText.toLowerCase();

  const ranked = templates
    .map((template) => {
      let score = 0;
      for (const keyword of template.matchingKeywords) {
        if (normalizedGoal.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      return { template, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.template.id.localeCompare(b.template.id);
    });

  return ranked[0]?.template ?? templates[0]!;
}
