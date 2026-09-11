import { cn } from "@/lib/utils";

/**
 * A small ▲/▼ with the percent change since the previous reading. For volume
 * up is good; for competition up is bad — `goodWhen` says which way is green.
 */
export function MovementBadge({
  change,
  goodWhen,
  className,
}: {
  change: number | null;
  goodWhen: "up" | "down";
  className?: string;
}) {
  if (change === null || change === 0) return null;
  const up = change > 0;
  const good = up === (goodWhen === "up");
  const size = Math.abs(change);

  return (
    <span
      title={`${up ? "Up" : "Down"} ${size}% since the previous reading`}
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums",
        good ? "text-emerald-300" : "text-red-300",
        className,
      )}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "up" : "down"} </span>
      {size > 999 ? "999+" : size}%
    </span>
  );
}
