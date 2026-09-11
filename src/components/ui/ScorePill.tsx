import { opportunityTier, TIER_CLASS, TIER_LABEL } from "@/features/keywords/opportunity";
import { cn } from "@/lib/utils";

/** The opportunity score as a small meter: a bar filled to the score, and the number. */
export function ScorePill({ score, showLabel = false }: { score: number; showLabel?: boolean }) {
  const tier = opportunityTier(score);

  return (
    <span
      title={`Opportunity score ${score}/100 — ${TIER_LABEL[tier]}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ring-1",
        TIER_CLASS[tier],
      )}
    >
      <span aria-hidden="true" className="relative h-1 w-6 overflow-hidden rounded-full bg-white/10">
        <span className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: `${score}%` }} />
      </span>
      {score}
      {showLabel ? <span className="font-semibold opacity-80">{TIER_LABEL[tier]}</span> : null}
    </span>
  );
}
