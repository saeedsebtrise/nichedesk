"use client";

import { Modal } from "@/components/ui/primitives";
import { TrademarkMarks } from "@/components/ui/Trademark";
import { CATEGORY_LABEL, IP_DISCLAIMER, type IpResult, type IpStatus } from "@/features/keywords/ip";
import type { TrademarkVerdict } from "@/features/keywords/trademarks";
import type { IpCheck } from "@/features/keywords/useIpCheck";
import { cn, formatNumber } from "@/lib/utils";

export const IP_STATUS: Record<IpStatus | "checking", { label: string; className: string; dot: string }> = {
  yes: { label: "Yes", className: "bg-red-500/15 text-red-200 ring-red-400/35", dot: "bg-red-500" },
  possible: { label: "Possible", className: "bg-amber-400/12 text-amber-200 ring-amber-400/30", dot: "bg-amber-400" },
  no: { label: "No", className: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25", dot: "bg-emerald-400" },
  unchecked: { label: "Not checked", className: "bg-white/[0.05] text-cream-200/55 ring-white/10", dot: "bg-cream-200/40" },
  checking: { label: "Checking", className: "bg-white/[0.04] text-cream-200/45 ring-white/10", dot: "animate-pulse bg-brand-400" },
};

/** One line on why: "Character · Disney" or what Wikipedia calls it. */
export function ipReason(result: IpResult | undefined): string {
  if (!result) return "Checking…";
  if (result.status === "no") return "No recognisable third-party IP found.";
  if (result.status === "unchecked") return "The online check did not answer; only the built-in list was checked.";
  return [result.category ? CATEGORY_LABEL[result.category] : null, result.matched ? `“${result.matched}”` : null, result.detail]
    .filter(Boolean)
    .join(" · ");
}

/** The COPYRIGHT/IP cell: a small coloured badge, with the reason and disclaimer as its tooltip. */
export function IpBadge({ result, onOpen }: { result: IpResult | undefined; onOpen: () => void }) {
  const style = IP_STATUS[result?.status ?? "checking"];
  const tooltip = `${ipReason(result)}\n${IP_DISCLAIMER}`;
  const body = (
    <>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </>
  );
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ring-1",
    style.className,
  );

  if (!result || result.status === "no") {
    return (
      <span title={tooltip} className={classes}>
        {body}
      </span>
    );
  }
  return (
    <button type="button" title={tooltip} onClick={onOpen} className={cn(classes, "transition-opacity hover:opacity-80")}>
      {body}
    </button>
  );
}

/** USPTO marks listed in the popup; the rest are summed up, to keep it small. */
const MARKS_SHOWN = 3;

const SOURCE: Record<NonNullable<IpResult["source"]>, string> = {
  catalog: "Found in NicheDesk’s list of well-known Etsy IP.",
  wikipedia: "Wikipedia describes it as shown above.",
  uspto: "Not a known word, but it has a live trademark filing at the USPTO.",
};

/** Why a keyword was flagged, with the USPTO marks behind it. Small on purpose: one keyword, one reason. */
export function IpModal({
  keyword,
  result,
  trademark,
  onClose,
}: {
  keyword: string | null;
  result: IpResult | undefined;
  trademark: TrademarkVerdict | null;
  onClose: () => void;
}) {
  const open = keyword !== null && result !== undefined;
  const style = IP_STATUS[result?.status ?? "checking"];

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title={open ? `“${keyword}”` : "Copyright/IP"}>
      {open ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">Copyright/IP</span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ring-1", style.className)}>
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
                {style.label}
              </span>
              {result.category ? (
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-cream-100">
                  {CATEGORY_LABEL[result.category]}
                </span>
              ) : null}
            </p>
            {result.matched ? (
              <p className="font-display mt-3 text-lg font-bold text-white">
                “{result.matched}”{result.detail ? <span className="font-sans text-sm font-normal text-cream-200/65"> — {result.detail}</span> : null}
              </p>
            ) : (
              <p className="mt-3 text-sm text-cream-200/70">{ipReason(result)}</p>
            )}
            {result.source ? <p className="mt-2 text-xs text-cream-200/50">{SOURCE[result.source]}</p> : null}
          </div>

          {trademark ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Live USPTO trademarks for “{trademark.term}”</p>
              <TrademarkMarks marks={trademark.marks.slice(0, MARKS_SHOWN)} />
              {trademark.marks.length > MARKS_SHOWN ? (
                <p className="text-xs text-cream-200/50">
                  and {trademark.marks.length - MARKS_SHOWN} more live mark{trademark.marks.length - MARKS_SHOWN === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-cream-200/50">
            {IP_DISCLAIMER} A “No” only means nothing recognisable was found — it does not make a name free to use.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

/** One line above a table: progress while checking, then the tally. */
export function IpStatusLine({ check }: { check: IpCheck }) {
  const { counts } = check;
  const total = counts.yes + counts.possible + counts.no + counts.unchecked + counts.checking;
  if (total === 0) return null;

  return (
    <p aria-live="polite" title={IP_DISCLAIMER} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream-200/55">
      {counts.checking > 0 ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-brand-400" />
          Checking copyright/IP… {formatNumber(total - counts.checking)} / {formatNumber(total)}
        </span>
      ) : (
        <span className="font-semibold text-cream-200/70">Copyright/IP</span>
      )}
      {(["yes", "possible", "no"] as const).map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", IP_STATUS[status].dot)} />
          {formatNumber(counts[status])} {IP_STATUS[status].label.toLowerCase()}
        </span>
      ))}
      {counts.unchecked > 0 && counts.checking === 0 ? (
        <span>
          {formatNumber(counts.unchecked)} not checked ·{" "}
          <button type="button" onClick={check.retry} className="font-semibold text-brand-300 hover:underline">
            Try again
          </button>
        </span>
      ) : null}
    </p>
  );
}
