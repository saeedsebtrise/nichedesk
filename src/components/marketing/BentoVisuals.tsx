"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ComponentType } from "react";

import type { FeatureVisual as VisualName } from "@/components/marketing/content";
import { Check, ICONS } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { BAND_CLASS, DEFAULT_COMPETITION_RULES, competitionBand } from "@/features/settings/competition";
import { cn } from "@/lib/utils";

/**
 * Small, live illustrations for the feature cards — miniature versions of the
 * real interface doing the thing the card describes. Loops only run while the
 * card is on screen, and reduced-motion users see the finished state.
 */

/** Steps a counter on a timer while the element is in view. */
function useTicker(steps: number, interval: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-40px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % steps), interval);
    return () => window.clearInterval(timer);
  }, [inView, reduce, steps, interval]);

  return { ref, step: reduce ? steps - 1 : step };
}

function Competition({ value }: { value: number }) {
  const band = competitionBand(value, DEFAULT_COMPETITION_RULES);
  return (
    <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums", BAND_CLASS[band])}>
      {value.toLocaleString("en-US")}
    </span>
  );
}

function Thresholds() {
  const reduce = useReducedMotion();
  const chips: [string, number][] = [
    ["later gator png", 465],
    ["retro sunset png", 8450],
    ["grinch png", 18760],
    ["christmas png", 930115],
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-8 px-6 sm:px-10">
      <div className="relative pb-6">
        <div className="relative flex h-3 gap-1">
          {["bg-emerald-600", "bg-emerald-300", "bg-amber-400", "bg-red-500"].map((color) => (
            <span key={color} className={cn("flex-1 rounded-full", color)} />
          ))}
          <motion.span
            aria-hidden="true"
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-night-950 shadow-[0_0_0_5px_rgba(255,255,255,0.1),0_0_24px_rgba(255,255,255,0.6)]"
            initial={{ left: "12%" }}
            animate={reduce ? undefined : { left: ["6%", "94%"] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        {[
          ["25%", "5,000"],
          ["50%", "10,000"],
          ["75%", "20,000"],
        ].map(([left, label]) => (
          <span
            key={label}
            className="absolute top-5 -translate-x-1/2 font-mono text-[11px] text-cream-200/50"
            style={{ left }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(([keyword, competition], index) => (
          <motion.span
            key={keyword}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.2 + index * 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-1 pl-3 text-xs text-cream-100"
          >
            {keyword}
            <Competition value={competition} />
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function Bulk() {
  const rows: [string, number][] = [
    ["christmas gnome png", 1890],
    ["ghost png", 4120],
    ["boy mom svg", 1760],
    ["valentine goose png", 119],
  ];
  // Rows tick one by one (steps 1–4), then the action bar appears.
  const { ref, step } = useTicker(9, 600);
  const barVisible = step >= 5;

  return (
    <div ref={ref} className="relative flex h-full flex-col justify-center px-6">
      <div className="space-y-1.5">
        {rows.map(([keyword, competition], index) => {
          const checked = step > index;
          return (
            <div
              key={keyword}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors duration-300",
                checked ? "border-brand-500/40 bg-brand-500/10 text-white" : "border-white/[0.06] bg-white/[0.02] text-cream-200/70",
              )}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border transition-colors duration-300",
                  checked ? "border-brand-500 bg-brand-500 text-white" : "border-white/25",
                )}
              >
                {checked ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="truncate">{keyword}</span>
              <span className="ml-auto">
                <Competition value={competition} />
              </span>
            </div>
          );
        })}
      </div>
      <motion.div
        animate={{ opacity: barVisible ? 1 : 0, y: barVisible ? 0 : 12 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="absolute inset-x-6 bottom-5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-semibold text-night-950 shadow-2xl"
      >
        <span>4 selected</span>
        <span className="rounded-lg bg-brand-500 px-2.5 py-1 text-white">✓ Mark done</span>
      </motion.div>
    </div>
  );
}

function FileChip({ name, rows, fresh = false }: { name: string; rows: string; fresh?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2",
        fresh ? "border-brand-500/40 bg-brand-500/10" : "border-white/10 bg-white/[0.03]",
      )}
    >
      <span className="rounded bg-emerald-500/20 px-1.5 py-px text-[9px] font-bold text-emerald-300">CSV</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-white">{name}</span>
        <span className="block text-[10px] text-cream-200/50">{rows}</span>
      </span>
    </div>
  );
}

function Reimport() {
  const { ref, step } = useTicker(5, 1000);
  const merged = step >= 2;

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-2.5 px-6">
      <div className="grid grid-cols-2 gap-2">
        <FileChip name="png · june.csv" rows="1,759 rows" />
        <motion.div
          animate={{ opacity: step >= 1 ? 1 : 0.2, x: step >= 1 ? 0 : 16 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <FileChip name="png · july.csv" rows="1,797 rows" fresh />
        </motion.div>
      </div>
      <p aria-hidden="true" className="text-center text-cream-200/40">
        ↓
      </p>
      <div className="rounded-xl border border-white/10 bg-night-950/70 p-3">
        <p className="text-xs font-semibold text-white">Niche: png</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <motion.span
            animate={{ opacity: merged ? 1 : 0.25, scale: merged ? 1 : 0.95 }}
            className="rounded-md bg-emerald-500/15 px-2 py-1 font-bold text-emerald-300"
          >
            +38 new
          </motion.span>
          <motion.span animate={{ opacity: merged ? 1 : 0.25 }} className="rounded-md bg-white/[0.06] px-2 py-1 text-cream-200/60">
            1,759 already there · skipped
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function Progress() {
  const total = 39;
  const rings = [
    { label: "Pending", value: 34, color: "#f4671f" },
    { label: "Done", value: 5, color: "#34d399" },
    { label: "Low comp.", value: 18, color: "#fbbf24" },
  ];

  return (
    <div className="flex h-full items-center justify-center gap-5 px-6">
      {rings.map((ring, index) => (
        <div key={ring.label} className="flex flex-col items-center gap-2">
          <div className="relative size-20">
            <svg viewBox="0 0 80 80" className="size-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <motion.circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={ring.color}
                strokeWidth="7"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: ring.value / total }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: EASE, delay: 0.2 + index * 0.15 }}
                style={{ filter: `drop-shadow(0 0 6px ${ring.color})` }}
              />
            </svg>
            <span className="font-display absolute inset-0 grid place-items-center text-lg font-bold text-white">
              {ring.value}
            </span>
          </div>
          <span className="text-[11px] font-medium text-cream-200/60">{ring.label}</span>
        </div>
      ))}
    </div>
  );
}

const SEARCH_WORDS = ["christmas", "teacher", "ghost"];
// Each word: clear, type it letter by letter, then hold it for a moment.
const SEARCH_FRAMES = SEARCH_WORDS.flatMap((word) => [
  "",
  ...Array.from({ length: word.length }, (_, index) => word.slice(0, index + 1)),
  ...new Array<string>(7).fill(word),
]);
const SEARCH_KEYWORDS: [string, number][] = [
  ["christmas png", 930115],
  ["christmas gnome png", 1890],
  ["watercolor christmas tree png", 1320],
  ["teacher png", 216592],
  ["teacher appreciation png", 3140],
  ["ghost png", 4120],
  ["ghost pumpkin png", 2210],
];

function Highlight({ text, term }: { text: string; term: string }) {
  const at = term ? text.indexOf(term) : -1;
  if (at < 0) return <span className="truncate">{text}</span>;
  return (
    <span className="truncate">
      {text.slice(0, at)}
      <mark className="rounded bg-brand-500/30 px-0.5 text-white">{text.slice(at, at + term.length)}</mark>
      {text.slice(at + term.length)}
    </span>
  );
}

function Search() {
  const { ref, step } = useTicker(SEARCH_FRAMES.length, 110);
  const typed = SEARCH_FRAMES[step];
  const results = SEARCH_KEYWORDS.filter(([keyword]) => keyword.includes(typed)).slice(0, 3);
  const SearchIcon = ICONS.search;

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-3 px-6">
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-night-950/80 px-3 py-2.5 text-sm text-white shadow-[0_0_0_4px_rgba(244,103,31,0.08)]">
        <SearchIcon className="size-4 shrink-0 text-cream-200/50" />
        <span className="flex items-center">
          {typed}
          <span aria-hidden="true" className="caret ml-px inline-block h-4 w-px bg-brand-400" />
        </span>
        {typed ? null : <span className="text-cream-200/35">Search keyword…</span>}
      </div>
      <ul className="min-h-[6.25rem] space-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {results.map(([keyword, competition]) => (
            <motion.li
              key={keyword}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs text-cream-200/75"
            >
              <Highlight text={keyword} term={typed} />
              <Competition value={competition} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

const CSV_LINES = [
  "niche,keyword,volume,competition",
  "png › christmas png,christmas gnome png,3120,1890",
  "png › halloween png,ghost png,3310,4120",
  "svg files › mom svg,boy mom svg,2140,1760",
  "png,later gator png,7432,465",
];

function Export() {
  const { ref, step } = useTicker(CSV_LINES.length + 3, 600);
  const done = step >= CSV_LINES.length;
  const DownloadIcon = ICONS.download;

  return (
    <div ref={ref} className="flex h-full items-center gap-4 px-6 sm:gap-6 sm:px-10">
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-night-950/80 font-mono text-[10.5px] leading-relaxed">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-cream-200/60">
          <span className="rounded bg-emerald-500/20 px-1.5 py-px text-[9px] font-bold text-emerald-300">CSV</span>
          <span className="truncate">nichedesk-export.csv</span>
          <span className="ml-auto shrink-0 tabular-nums">{Math.min(step, CSV_LINES.length - 1)} rows</span>
        </div>
        <div className="space-y-0.5 px-3 py-2.5">
          {CSV_LINES.map((line, index) => (
            <motion.p
              key={line}
              animate={{ opacity: step >= index ? 1 : 0.08, x: step >= index ? 0 : -6 }}
              transition={{ duration: 0.35 }}
              className={cn("truncate", index === 0 ? "text-brand-300" : "text-cream-200/75")}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
      <motion.div
        animate={{ scale: done ? 1 : 0.9, opacity: done ? 1 : 0.4 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white shadow-[0_0_40px_-6px_rgba(244,103,31,0.9)]"
      >
        <DownloadIcon className="size-7" />
      </motion.div>
    </div>
  );
}

function Privacy() {
  const LockIcon = ICONS.lock;
  const chips = [
    { label: "No signup", className: "top-[20%] left-[8%]" },
    { label: "No analytics", className: "top-[28%] right-[8%] float-slower" },
    { label: "Export anytime", className: "bottom-[12%] left-1/2 -translate-x-1/2" },
  ];

  return (
    <div className="relative flex h-full items-center justify-center">
      <span aria-hidden="true" className="pulse-ring absolute size-24 rounded-3xl border border-brand-500/40" />
      <span
        aria-hidden="true"
        className="pulse-ring absolute size-24 rounded-3xl border border-brand-500/30 [animation-delay:1.4s]"
      />
      <div className="relative grid size-20 place-items-center rounded-3xl bg-gradient-to-b from-[#2b1a10] to-night-950 shadow-[0_0_60px_-10px_rgba(244,103,31,0.75)] ring-1 ring-white/10">
        <LockIcon className="size-8 text-brand-300" />
      </div>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn(
            "absolute rounded-full border border-white/10 bg-night-900/90 px-3 py-1.5 text-xs font-medium text-cream-100 backdrop-blur",
            chip.className.includes("float-slower") ? null : "float-slow",
            chip.className,
          )}
        >
          <span className="text-brand-300">✓</span> {chip.label}
        </span>
      ))}
    </div>
  );
}

const VISUALS: Record<VisualName, ComponentType> = {
  thresholds: Thresholds,
  bulk: Bulk,
  reimport: Reimport,
  progress: Progress,
  search: Search,
  export: Export,
  privacy: Privacy,
};

export function FeatureVisual({ name }: { name: VisualName }) {
  const Visual = VISUALS[name];
  return <Visual />;
}
