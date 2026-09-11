"use client";

import { motion } from "motion/react";

import { Check } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

export type TreeBranch = { name: string; count: number; samples: string[] };

// Full class names, so Tailwind generates them.
const COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/**
 * The auto-subniche umbrella, drawn: a category at the top and its subniches
 * below, with branches that draw themselves as the diagram scrolls into view.
 */
export function TreeCanvas({
  root,
  total,
  branches,
  stay,
  minGroupSize,
}: {
  root: string;
  total: number;
  branches: TreeBranch[];
  stay: number;
  minGroupSize: number;
}) {
  const count = branches.length;

  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative z-10 rounded-2xl bg-brand-500 px-7 py-4 text-center shadow-[0_0_70px_-12px_rgba(244,103,31,0.9)] ring-1 ring-white/20"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/75 uppercase">Category</p>
          <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{root}</p>
          <p className="text-xs text-white/80">{total} keywords dropped in</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2 text-xs"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-cream-100 ring-1 ring-white/15">
            <Check className="size-3.5 text-brand-300" /> Auto-create subniches
          </span>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-cream-100 ring-1 ring-white/15">
            Min keywords per subniche · {minGroupSize}
          </span>
        </motion.div>
      </div>

      {/* Branches from the category to each subniche (wide screens). */}
      <svg aria-hidden="true" viewBox="0 0 1000 140" preserveAspectRatio="none" className="hidden h-28 w-full lg:block">
        <defs>
          <linearGradient id="nd-branch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4671f" />
            <stop offset="1" stopColor="#ffab7d" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {branches.map((branch, index) => {
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
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 + index * 0.12 }}
            />
          );
        })}
      </svg>

      <ul className={cn("mt-8 grid gap-4 border-l border-brand-500/40 pl-5 lg:mt-0 lg:border-l-0 lg:pl-0", COLUMNS[count] ?? "lg:grid-cols-4")}>
        {branches.map((branch, index) => (
          <motion.li
            key={branch.name}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.5 + index * 0.12 }}
            className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/12 backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-brand-300">
                └
              </span>
              <p className="font-bold text-white">{branch.name}</p>
              <span className="ml-auto rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-200">
                {branch.count}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {branch.samples.map((sample) => (
                <span key={sample} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-cream-200/80">
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
        transition={{ duration: 0.5, delay: 1.5 }}
        className="mx-auto mt-6 w-fit rounded-full border border-dashed border-white/20 px-4 py-2 text-center text-xs text-cream-200/70"
      >
        {stay} keywords share no theme yet — they stay in “{root}”
      </motion.p>
    </div>
  );
}
