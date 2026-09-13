"use client";

import { ArrowUpRight } from "@/components/marketing/icons";
import { PRODUCT_CLASSES, usptoCaseUrl, type TrademarkMark, type TrademarkVerdict } from "@/features/keywords/trademarks";
import { cn } from "@/lib/utils";

const LEVEL = {
  registered: { label: "Trademark", className: "bg-red-500/15 text-red-200 ring-red-400/35 hover:bg-red-500/25" },
  possible: { label: "Possible TM", className: "bg-amber-400/12 text-amber-200 ring-amber-400/30 hover:bg-amber-400/20" },
} as const;

/** A small ™ pill next to a keyword: live USPTO marks for the name it matched. */
export function TrademarkBadge({
  verdict,
  onOpen,
  className,
}: {
  verdict: TrademarkVerdict;
  onOpen: () => void;
  className?: string;
}) {
  const level = LEVEL[verdict.level];
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`“${verdict.term}” matches ${verdict.marks.length} live USPTO mark${verdict.marks.length === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide uppercase ring-1 transition-colors",
        level.className,
        className,
      )}
    >
      <span aria-hidden="true">™</span>
      {level.label}
    </button>
  );
}

const classLabel = (code: string) => PRODUCT_CLASSES[code] ?? `Class ${code}`;

/** The live USPTO marks for a name, each linked to its record. */
export function TrademarkMarks({ marks }: { marks: TrademarkMark[] }) {
  return (
    <ul className="space-y-2">
      {marks.map((mark) => (
        <li key={mark.serial} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-white">{mark.wordmark}</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1",
                mark.registered ? "bg-red-500/15 text-red-200 ring-red-400/30" : "bg-amber-400/12 text-amber-200 ring-amber-400/25",
              )}
            >
              {mark.registered ? "Registered ®" : "Application"}
            </span>
            <a
              href={usptoCaseUrl(mark.serial)}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200"
            >
              USPTO record <ArrowUpRight className="size-3.5" />
            </a>
          </div>
          {mark.owner ? <p className="mt-1 text-sm text-cream-200/70">{mark.owner}</p> : null}
          <p className="mt-1.5 flex flex-wrap gap-1">
            {mark.classes.map((code) => (
              <span
                key={code}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px]",
                  code in PRODUCT_CLASSES ? "bg-white/[0.08] text-cream-100" : "bg-white/[0.03] text-cream-200/45",
                )}
              >
                {classLabel(code)}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}
