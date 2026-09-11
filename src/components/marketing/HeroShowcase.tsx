"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { ReactNode } from "react";

import work from "@/assets/screenshots/work.png";
import { Check } from "@/components/marketing/icons";
import { MacWindow } from "@/components/marketing/MacWindow";
import { EASE, ScrollTilt } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

/**
 * The product window under the hero, with glass cards floating around it.
 * The cards drift against the pointer at different depths (parallax), so the
 * scene has layers; they are decorative, and hidden below desktop widths.
 */

const GLASS =
  "rounded-2xl border border-white/10 bg-night-900/80 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl";

function Chip({
  x,
  y,
  depth,
  delay,
  className,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
  delay: number;
  className: string;
  children: ReactNode;
}) {
  const shiftX = useTransform(x, (value) => value * depth);
  const shiftY = useTransform(y, (value) => value * depth);

  return (
    <motion.div aria-hidden="true" style={{ x: shiftX, y: shiftY }} className={cn("absolute z-10 hidden lg:block", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      >
        <div className="float-slow">{children}</div>
      </motion.div>
    </motion.div>
  );
}

const SUBNICHES: [string, number][] = [
  ["party invitation", 8],
  ["wedding invitation", 6],
  ["birthday invitation", 5],
  ["shower invitation", 5],
];

const LEGEND: [string, string][] = [
  ["bg-emerald-600", "Below 5,000"],
  ["bg-emerald-300", "Up to 10,000"],
  ["bg-amber-400", "Up to 20,000"],
  ["bg-red-500", "Above that"],
];

export function HeroShowcase() {
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 50, damping: 16 });
  const y = useSpring(pointerY, { stiffness: 50, damping: 16 });

  return (
    <div
      onMouseMove={(event) => {
        if (reduce) return;
        const box = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - box.left) / box.width - 0.5);
        pointerY.set((event.clientY - box.top) / box.height - 0.5);
      }}
      onMouseLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className="relative mx-auto mt-20 max-w-6xl px-5 pb-28 sm:mt-24 sm:px-8 sm:pb-36"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[8%] top-[8%] bottom-[22%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.42),transparent)] blur-3xl"
      />

      <ScrollTilt>
        <MacWindow
          src={work}
          alt="NicheDesk Upcoming Work view in a browser window: stat tiles, filters, competition colour rules, and a keyword table with niche paths such as png › christmas png"
          priority
          sizes="(min-width: 1200px) 1120px, 94vw"
        />
      </ScrollTilt>

      <Chip x={x} y={y} depth={-50} delay={0.9} className="top-[15%] left-0 xl:-left-16">
        <div className={cn(GLASS, "flex items-start gap-3 p-3.5 pr-5")}>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">File uploaded successfully</p>
            <p className="text-xs text-cream-200/55">eRank - Keyword Tool.csv · 1,759 keywords</p>
          </div>
        </div>
      </Chip>

      <Chip x={x} y={y} depth={40} delay={1.05} className="top-[6%] right-0 xl:-right-16">
        <div className={cn(GLASS, "w-60 p-4 text-left")}>
          <p className="text-[10px] font-bold tracking-[0.18em] text-brand-300 uppercase">Auto subniches</p>
          <p className="mt-1 font-semibold text-white">Invitation</p>
          <ul className="mt-2 space-y-1 text-xs text-cream-200/70">
            {SUBNICHES.map(([name, count]) => (
              <li key={name} className="flex justify-between gap-3">
                <span>
                  <span className="text-brand-400">└</span> {name}
                </span>
                <span className="text-cream-200/45 tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </Chip>

      <Chip x={x} y={y} depth={60} delay={1.2} className="bottom-[24%] left-2 xl:-left-12">
        <div className={cn(GLASS, "w-52 p-4 text-left")}>
          <p className="text-xs font-semibold text-white">Competition colours</p>
          <ul className="mt-3 space-y-2 text-xs text-cream-200/70">
            {LEGEND.map(([color, label]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", color)} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </Chip>

      <Chip x={x} y={y} depth={-36} delay={1.35} className="right-2 bottom-[32%] xl:-right-12">
        <div className={cn(GLASS, "flex items-center gap-3 p-4 pr-5 text-left")}>
          <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#f4671f"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(18 / 39) * 100} 100`}
            />
          </svg>
          <div>
            <p className="font-display text-xl leading-none font-bold text-white">18</p>
            <p className="mt-1 text-xs text-cream-200/55">low-competition keywords open</p>
          </div>
        </div>
      </Chip>
    </div>
  );
}
