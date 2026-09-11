"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type KeyboardEvent } from "react";

import { Check } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

export type TreeBranch = { name: string; count: number; samples: string[] };

export type SampleTree = {
  id: string;
  root: string;
  total: number;
  /** Keywords that fit no theme; they stay in the category itself. */
  stay: number;
  branches: TreeBranch[];
};

// Full class names, so Tailwind generates them.
const COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/**
 * One category and its subniches, drawn: the branches draw themselves and the
 * subniche cards pop in beneath them.
 */
function TreeCanvas({ tree, minGroupSize }: { tree: SampleTree; minGroupSize: number }) {
  const count = tree.branches.length;

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative z-10 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 px-8 py-4 text-center shadow-[0_0_80px_-12px_rgba(244,103,31,0.9),inset_0_1px_0_rgba(255,255,255,0.35)]"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/75 uppercase">Category</p>
          <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{tree.root}</p>
          <p className="text-xs text-white/80">{tree.total} keywords dropped in</p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-cream-100">
            <Check className="size-3.5 text-brand-300" /> Auto-create subniches
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-cream-100">
            Min keywords per subniche · {minGroupSize}
          </span>
        </div>
      </div>

      {/* Branches from the category to each subniche (wide screens). */}
      <svg aria-hidden="true" viewBox="0 0 1000 140" preserveAspectRatio="none" className="hidden h-28 w-full lg:block">
        <defs>
          {/* User-space units: a straight vertical branch has a zero-width box. */}
          <linearGradient id="nd-branch" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="140">
            <stop offset="0" stopColor="#f4671f" />
            <stop offset="1" stopColor="#ffab7d" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {tree.branches.map((branch, index) => {
          const x = ((index + 0.5) / count) * 1000;
          return (
            <motion.path
              key={branch.name}
              d={`M500 0 C500 80, ${x} 60, ${x} 140`}
              fill="none"
              stroke="url(#nd-branch)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.25 + index * 0.1 }}
            />
          );
        })}
      </svg>

      <ul
        className={cn(
          "mt-8 grid gap-4 border-l border-brand-500/40 pl-5 lg:mt-0 lg:border-l-0 lg:pl-0",
          COLUMNS[count] ?? "lg:grid-cols-4",
        )}
      >
        {tree.branches.map((branch, index) => (
          <motion.li
            key={branch.name}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.4 + index * 0.1 }}
            className="rounded-2xl border border-white/10 bg-night-900/75 p-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-brand-300">
                └
              </span>
              <p className="truncate font-semibold text-white">{branch.name}</p>
              <span className="ml-auto rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-200">
                {branch.count}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {branch.samples.map((sample) => (
                <span key={sample} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-cream-200/75">
                  {sample}
                </span>
              ))}
            </div>
          </motion.li>
        ))}
      </ul>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 1 }}
        className="mx-auto mt-6 w-fit rounded-full border border-dashed border-white/20 px-4 py-2 text-center text-xs text-cream-200/65"
      >
        {tree.stay} keywords share no theme yet — they stay in “{tree.root}”
      </motion.p>
    </div>
  );
}

/** Tabs across a few sample categories, each re-drawing its tree. */
export function TreeExplorer({ trees, minGroupSize }: { trees: SampleTree[]; minGroupSize: number }) {
  const [active, setActive] = useState(0);
  const tree = trees[active];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (active + (event.key === "ArrowRight" ? 1 : trees.length - 1)) % trees.length;
    setActive(next);
    document.getElementById(`tree-tab-${trees[next].id}`)?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sample category"
        onKeyDown={onKeyDown}
        className="mx-auto flex w-fit gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur"
      >
        {trees.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tree-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="tree-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "relative rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors sm:px-7",
                selected ? "text-white" : "text-cream-200/60 hover:text-white",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="tree-tab-pill"
                  className="absolute inset-0 rounded-xl bg-brand-500 shadow-[0_10px_30px_-8px_rgba(244,103,31,0.9)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              ) : null}
              <span className="relative">{item.root}</span>
            </button>
          );
        })}
      </div>

      <div id="tree-panel" role="tabpanel" aria-labelledby={`tree-tab-${tree.id}`} className="mt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tree.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TreeCanvas tree={tree} minGroupSize={minGroupSize} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
