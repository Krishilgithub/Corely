/**
 * Freshness score for a piece of knowledge: 100 when new, falling every day.
 * The fall rate depends on the kind of content: chat goes stale fastest,
 * long-form docs slowest. Used by /api/ask and by project memory.
 */
export type FreshnessLabel = "Fresh" | "Aged" | "Stale";

export function calculateTemporalConfidence(
  sourceUpdatedAt: Date | null,
  createdAt: Date,
  sourceType?: string
): { score: number; label: FreshnessLabel } {
  const referenceDate = sourceUpdatedAt ?? createdAt;
  const ageInDays = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

  // Points lost per day, by content type
  let decayRate = 0.5; // Default: 200 days to zero
  if (sourceType === "slack_channel") decayRate = 2.0;      // chat ages fastest
  else if (sourceType === "github_issue" || sourceType === "github_pr") decayRate = 0.3;
  else if (sourceType === "notion_page" || sourceType === "google_doc") decayRate = 0.2;
  else if (sourceType === "linear_issue") decayRate = 0.4;

  let score = 100 - ageInDays * decayRate;
  if (score < 0) score = 0;

  let label: FreshnessLabel = "Fresh";
  if (score < 50) label = "Stale";
  else if (score < 80) label = "Aged";

  return { score: Math.round(score), label };
}
