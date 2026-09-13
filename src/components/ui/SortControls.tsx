"use client";

import { Close, Plus } from "@/components/marketing/icons";
import {
  MAX_SORT_RULES,
  defaultDirection,
  toggleSortRule,
  type SortDirection,
  type SortKey,
  type SortRule,
} from "@/features/keywords/filters";
import { cn } from "@/lib/utils";

export const SORT_LABEL: Record<SortKey, string> = {
  keyword: "Keyword",
  score: "Score",
  volume: "Volume",
  competition: "Competition",
  ip: "Copyright/IP",
};

export function directionText(key: SortKey, direction: SortDirection) {
  if (key === "keyword") return direction === "asc" ? "A → Z" : "Z → A";
  if (key === "ip") return direction === "asc" ? "No → yes" : "Yes → no";
  return direction === "asc" ? "Low → high" : "High → low";
}

export const ariaSortOf = (rules: SortRule[], key: SortKey) =>
  rules[0]?.key === key ? (rules[0].direction === "asc" ? "ascending" : "descending") : undefined;

/** Up and down arrows; the one in use lights up. */
function Arrows({ direction }: { direction: SortDirection | null }) {
  return (
    <svg viewBox="0 0 10 14" aria-hidden="true" className="h-3 w-2.5 shrink-0">
      <path d="M5 1 9 5.5H1Z" className={direction === "asc" ? "fill-brand-300" : "fill-current opacity-30"} />
      <path d="M5 13 1 8.5h8Z" className={direction === "desc" ? "fill-brand-300" : "fill-current opacity-30"} />
    </svg>
  );
}

/**
 * A sortable column title. Click sorts by this column (again to flip it);
 * Shift+click adds it as another sort level.
 */
export function SortHeader({
  sortKey,
  rules,
  onChange,
  label = SORT_LABEL[sortKey],
  className,
}: {
  sortKey: SortKey;
  rules: SortRule[];
  onChange: (rules: SortRule[]) => void;
  label?: string;
  className?: string;
}) {
  const index = rules.findIndex((rule) => rule.key === sortKey);
  const rule = index >= 0 ? rules[index] : null;

  return (
    <button
      type="button"
      onClick={(event) => onChange(toggleSortRule(rules, sortKey, event.shiftKey))}
      title={`Sort by ${label.toLowerCase()} · Shift+click to sort by this as well`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-night-900 focus-visible:outline-none",
        rule ? "text-brand-200" : "text-cream-200/45 hover:text-white",
        className,
      )}
    >
      {label}
      <Arrows direction={rule?.direction ?? null} />
      {rule && rules.length > 1 ? (
        <span className="grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-bold tracking-normal text-white">
          {index + 1}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The sort, spelled out: one chip per level ("1 Competition · High → low"),
 * each flipped by a click, plus "Then by" to add the next level.
 */
export function SortBar({
  rules,
  onChange,
  keys = ["keyword", "score", "volume", "competition", "ip"],
  emptyLabel = "File order",
}: {
  rules: SortRule[];
  onChange: (rules: SortRule[]) => void;
  keys?: SortKey[];
  emptyLabel?: string;
}) {
  const unused = keys.filter((key) => !rules.some((rule) => rule.key === key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">Sort</span>

      {rules.length === 0 ? <span className="text-xs text-cream-200/45">{emptyLabel}</span> : null}

      {rules.map((rule, index) => (
        <span
          key={rule.key}
          className="inline-flex items-center overflow-hidden rounded-xl border border-brand-500/45 bg-brand-500/12 text-xs font-semibold text-brand-100"
        >
          {index > 0 ? <span className="pl-2.5 text-[10px] font-medium text-brand-200/60 uppercase">then</span> : null}
          <button
            type="button"
            onClick={() => onChange(toggleSortRule(rules, rule.key, true))}
            title="Flip this sort"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 transition-colors hover:bg-brand-500/15"
          >
            <span className="grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
              {index + 1}
            </span>
            {SORT_LABEL[rule.key]}
            <span className="font-medium text-brand-200/80">· {directionText(rule.key, rule.direction)}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange(rules.filter((other) => other.key !== rule.key))}
            aria-label={`Stop sorting by ${SORT_LABEL[rule.key].toLowerCase()}`}
            className="border-l border-brand-500/30 px-2 py-1.5 transition-colors hover:bg-brand-500/25"
          >
            <Close className="size-3" />
          </button>
        </span>
      ))}

      {rules.length < MAX_SORT_RULES && unused.length > 0 ? (
        <label className="relative inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-cream-200/75 transition-colors focus-within:border-brand-500/60 hover:bg-white/[0.07] hover:text-white">
          <Plus className="size-3.5" />
          {rules.length === 0 ? "Sort by" : "Then by"}
          <select
            value=""
            aria-label={rules.length === 0 ? "Sort by" : "Then sort by"}
            onChange={(event) => {
              const key = event.target.value as SortKey;
              if (key) onChange([...rules, { key, direction: defaultDirection(key) }]);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="">Choose a column</option>
            {unused.map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {rules.length > 1 ? (
        <span className="text-[11px] text-cream-200/45">
          Sorted by the colour groups of {SORT_LABEL[rules[0].key].toLowerCase()} first, then inside each group.
        </span>
      ) : null}
    </div>
  );
}
