/**
 * Opportunity score, 0–100: how much search demand a keyword has for each
 * competing listing, on a log scale so the whole range stays readable.
 *
 * The ratio is volume / (competition + 1):
 *   0.01 — a hundred competing listings per search — scores 0
 *   1    — one listing per search                  — scores 57
 *   30+  — thirty searches per listing             — scores 100
 */
const LOG_FLOOR = -2;
const LOG_SPAN = 3.5;

export function opportunityScore(volume: number, competition: number): number {
  if (!(volume > 0)) return 0;
  const listings = Number.isFinite(competition) && competition > 0 ? competition : 0;
  const ratio = volume / (listings + 1);
  const score = ((Math.log10(ratio) - LOG_FLOOR) / LOG_SPAN) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export type OpportunityTier = "hot" | "good" | "fair" | "tough";

export function opportunityTier(score: number): OpportunityTier {
  if (score >= 70) return "hot";
  if (score >= 45) return "good";
  if (score >= 25) return "fair";
  return "tough";
}

export const TIER_LABEL: Record<OpportunityTier, string> = {
  hot: "Hot",
  good: "Good",
  fair: "Fair",
  tough: "Tough",
};

/** Pill colours per tier, for the dark tool. */
export const TIER_CLASS: Record<OpportunityTier, string> = {
  hot: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  good: "bg-lime-400/15 text-lime-300 ring-lime-400/25",
  fair: "bg-amber-400/15 text-amber-300 ring-amber-400/25",
  tough: "bg-white/[0.06] text-cream-200/55 ring-white/10",
};
