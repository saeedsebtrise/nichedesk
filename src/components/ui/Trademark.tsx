"use client";

import { ArrowUpRight } from "@/components/marketing/icons";
import { Modal } from "@/components/ui/primitives";
import { PRODUCT_CLASSES, usptoCaseUrl, type TrademarkVerdict } from "@/features/keywords/trademarks";
import type { TrademarkCheck } from "@/features/keywords/useTrademarks";
import { cn } from "@/lib/utils";

const LEVEL = {
  registered: { label: "Trademark", className: "bg-red-500/15 text-red-200 ring-red-400/35 hover:bg-red-500/25" },
  possible: { label: "Possible TM", className: "bg-amber-400/12 text-amber-200 ring-amber-400/30 hover:bg-amber-400/20" },
} as const;

/** A small ™ pill next to a keyword; opens the marks it matched. */
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

const className = (code: string) => PRODUCT_CLASSES[code] ?? `Class ${code}`;

/** One line on the trademark check: still checking, could not check, or how many were flagged. */
export function TrademarkStatus({ check, flagged, scope }: { check: TrademarkCheck; flagged: number; scope: string }) {
  return (
    <p aria-live="polite" className="text-xs text-cream-200/55">
      {check.checking > 0 ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-brand-400" />
          Checking trademarks on USPTO…
        </span>
      ) : check.unanswered > 0 ? (
        <>
          USPTO did not answer for {check.unanswered} phrase{check.unanswered === 1 ? "" : "s"} ·{" "}
          <button type="button" onClick={check.retry} className="font-semibold text-brand-300 hover:underline">
            Try again
          </button>
        </>
      ) : (
        <>
          <span aria-hidden="true">™ </span>
          {flagged === 0 ? `No trademarks found ${scope}` : `${flagged} possible trademark${flagged === 1 ? "" : "s"} ${scope}`}
        </>
      )}
    </p>
  );
}

/** What the USPTO holds for a flagged keyword, with links to each record. */
export function TrademarkModal({
  keyword,
  verdict,
  onClose,
}: {
  keyword: string | null;
  verdict: TrademarkVerdict | null;
  onClose: () => void;
}) {
  const open = keyword !== null && verdict !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-xl"
      title={open ? `“${keyword}” may be a trademark` : "Trademark check"}
      description={
        open ? (
          <>
            The words <b className="text-white">“{verdict.term}”</b> match{" "}
            {verdict.level === "registered"
              ? "a registered trademark that covers products like yours."
              : "a live trademark application, or a mark on other goods."}
          </>
        ) : null
      }
    >
      {open ? (
        <div className="space-y-4">
          <ul className="space-y-2">
            {verdict.marks.map((mark) => (
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
                      {className(code)}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-cream-200/50">
            Checked against live marks in the USPTO trademark search. A first check, not legal advice: the USPTO covers US
            trademarks, not copyright, and a missing match does not make a name free to use.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
