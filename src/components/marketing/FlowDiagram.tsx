"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

/**
 * The hero diagram: an eRank export flowing through the four stages of
 * NicheDesk. A highlight steps from stage to stage and sparks run along the
 * connectors, so the page shows the workflow instead of describing it.
 * The figures are an illustrative run, labelled as such.
 */

const Chip = ({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "green" | "red" | "amber" }) => (
  <span
    className={cn(
      "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold",
      tone === "brand" && "bg-brand-500/20 text-brand-300",
      tone === "green" && "bg-emerald-500/20 text-emerald-300",
      tone === "red" && "bg-red-500/20 text-red-300",
      tone === "amber" && "bg-amber-400/20 text-amber-200",
    )}
  >
    {children}
  </span>
);

const STAGES: { title: string; value: string; caption: string; visual: ReactNode }[] = [
  {
    title: "eRank CSV",
    value: "1,759",
    caption: "keywords uploaded",
    visual: (
      <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-2 py-1.5 text-[10px] text-cream-200/80">
        <span aria-hidden="true" className="grid size-5 place-items-center rounded bg-emerald-500/25 text-[9px] font-black text-emerald-300">
          CSV
        </span>
        <span className="truncate">eRank - Keyword Tool.csv</span>
      </div>
    ),
  },
  {
    title: "Filter",
    value: "309",
    caption: "worth making",
    visual: (
      <div className="flex flex-wrap gap-1">
        <Chip>including “png”</Chip>
        <Chip>≤ 25k competition</Chip>
      </div>
    ),
  },
  {
    title: "Niche tree",
    value: "14",
    caption: "subniches, automatically",
    visual: (
      <div className="space-y-0.5 font-mono text-[10px] leading-snug text-cream-200/80">
        <p className="font-bold text-white">png</p>
        <p className="pl-2">└ christmas png</p>
        <p className="pl-5">└ christmas tree png</p>
        <p className="pl-2">└ halloween png</p>
      </div>
    ),
  },
  {
    title: "Work queue",
    value: "GO",
    caption: "tick it, make it, mark it done",
    visual: (
      <div className="space-y-1 text-[10px] text-cream-200/80">
        {[
          ["later gator png", "465", "green"],
          ["ghost png", "4,120", "green"],
          ["grinch png", "18,760", "amber"],
        ].map(([keyword, competition, tone]) => (
          <div key={keyword} className="flex items-center justify-between gap-2">
            <span className="truncate">{keyword}</span>
            <Chip tone={tone as "green" | "amber"}>{competition}</Chip>
          </div>
        ))}
      </div>
    ),
  },
];

export function FlowDiagram() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % STAGES.length), 1900);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <figure>
      <figcaption className="mb-4 text-center text-[11px] font-semibold tracking-[0.18em] text-cream-200/50 uppercase">
        One eRank export, start to finish — an example run
      </figcaption>
      <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:gap-0">
        {STAGES.map((stage, index) => (
          <li key={stage.title} className="flex flex-col items-stretch lg:flex-1 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.9 + index * 0.12 }}
              className={cn(
                "relative flex-1 rounded-2xl p-4 text-left ring-1 backdrop-blur transition-[background-color,box-shadow] duration-500",
                active === index
                  ? "bg-white/[0.09] shadow-[0_0_48px_-10px_rgba(244,103,31,0.7)] ring-brand-400/60"
                  : "bg-white/[0.035] ring-white/10",
              )}
            >
              <p className="flex items-center gap-2 text-[11px] font-semibold text-cream-200/70">
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-md text-[10px] font-black transition-colors duration-500",
                    active === index ? "bg-brand-500 text-white" : "bg-white/10 text-cream-200/70",
                  )}
                >
                  {index + 1}
                </span>
                {stage.title}
              </p>
              <p className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white">{stage.value}</p>
              <p className="text-[11px] text-cream-200/60">{stage.caption}</p>
              <div className="mt-3">{stage.visual}</div>
            </motion.div>

            {index < STAGES.length - 1 ? (
              <div aria-hidden="true" className="relative mx-auto h-6 w-px bg-white/15 lg:mx-0 lg:h-px lg:w-10 lg:shrink-0 lg:self-center">
                <span
                  className={cn(
                    "absolute inset-0 origin-top bg-gradient-to-b from-brand-500 to-amber-300 transition-transform duration-700 lg:origin-left lg:bg-gradient-to-r",
                    active > index ? "scale-100" : "scale-0",
                  )}
                />
                <span className="travel-dot absolute top-1/2 hidden size-[7px] -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(255,171,125,0.9)] lg:block" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}
