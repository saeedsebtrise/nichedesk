"use client";

import { AnimatePresence, motion } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useState, type ReactNode } from "react";

import addToNiche from "@/assets/screenshots/add-to-niche.png";
import colorRules from "@/assets/screenshots/color-rules.png";
import sort from "@/assets/screenshots/sort.png";
import table from "@/assets/screenshots/table.png";
import { STORY, type StoryStep } from "@/components/marketing/content";
import { Check } from "@/components/marketing/icons";
import { MacWindow } from "@/components/marketing/MacWindow";
import { EASE } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

/**
 * "How it works" as a scroll story: on wide screens the picture stays pinned
 * while the steps scroll past it, swapping as each step reaches the middle of
 * the screen; steps not in focus dim. On phones each step carries its picture.
 */

function BrowserFrame({ src, alt, children }: { src: StaticImageData; alt: string; children?: ReactNode }) {
  return (
    <div className="relative">
      <MacWindow src={src} alt={alt} compact sizes="(min-width: 1024px) 680px, 92vw" />
      {children}
    </div>
  );
}

const Float = ({ children, className, delay = 0.25 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.55, ease: EASE, delay }}
    className={cn("absolute", className)}
  >
    {children}
  </motion.div>
);

function Visual({ id }: { id: StoryStep["id"] }) {
  if (id === "upload") {
    return (
      <BrowserFrame src={sort} alt="The Sort Keyword tab with an eRank CSV loaded into the import preview">
        {/* Sits over the real toast in the screenshot, as a zoomed-in callout of it. */}
        <Float className="top-11 right-1.5 w-64">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-night-900/95 p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] ring-1 ring-emerald-400/25 backdrop-blur">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500 text-sm font-black text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)]">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-white">File uploaded successfully</p>
              <p className="text-xs text-cream-200/60">eRank - Keyword Tool.csv · 1,759 keywords loaded</p>
            </div>
          </div>
        </Float>
      </BrowserFrame>
    );
  }

  if (id === "filter") {
    return (
      <BrowserFrame src={sort} alt="Import preview filters: including, excluding, volume and competition">
        {["🔍 Including: “png”", "🚫 Excluding: “free”", "⚔️ Competition ≤ 25,000"].map((chip, index) => (
          <Float key={chip} delay={0.2 + index * 0.12} className={cn("left-4", ["top-[34%]", "top-[46%]", "top-[58%]"][index])}>
            <span className="rounded-full bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(244,103,31,0.9)]">
              {chip}
            </span>
          </Float>
        ))}
      </BrowserFrame>
    );
  }

  if (id === "sort") {
    return (
      // The dialog is tall; this width keeps it inside the pinned panel on a laptop screen.
      <div className="relative mx-auto max-w-[21rem]">
        <div className="overflow-hidden rounded-2xl bg-night-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
          <Image
            src={addToNiche}
            alt="The Add to a niche dialog with the niche tree, a Nest under picker and the automatic subniche preview"
            placeholder="blur"
            sizes="(min-width: 1024px) 400px, 88vw"
            className="h-auto w-full"
          />
        </div>
        <Float className="-top-8 -right-4 w-60 sm:-right-14">
          <div className="rounded-2xl border border-white/10 bg-night-900/95 p-4 text-left text-white shadow-[0_0_50px_-12px_rgba(244,103,31,0.7)] ring-1 ring-brand-500/30 backdrop-blur">
            <p className="text-[10px] font-bold tracking-widest text-brand-300 uppercase">Auto subniches</p>
            <p className="mt-1 font-bold">Invitation</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs text-cream-200/80">
              <li>└ party invitation · 8</li>
              <li>└ wedding invitation · 6</li>
              <li>└ birthday invitation · 5</li>
              <li>└ shower invitation · 5</li>
            </ul>
          </div>
        </Float>
      </div>
    );
  }

  return (
    <BrowserFrame src={table} alt="The Upcoming Work table with competition badges coloured green to red, trend and type columns and ticks">
      <Float className="-bottom-8 left-[4%] w-[92%]">
        <div className="overflow-hidden rounded-xl bg-night-900 shadow-2xl ring-1 ring-white/10">
          <Image src={colorRules} alt="Competition colour rules" placeholder="blur" sizes="600px" className="h-auto w-full" />
        </div>
      </Float>
    </BrowserFrame>
  );
}

function StepText({
  step,
  index,
  active,
  onEnter,
}: {
  step: StoryStep;
  index: number;
  active: boolean;
  onEnter: (index: number) => void;
}) {
  return (
    <motion.article
      onViewportEnter={() => onEnter(index)}
      viewport={{ margin: "-45% 0px -45% 0px" }}
      aria-labelledby={`story-${step.id}`}
      className={cn(
        "flex flex-col justify-center py-10 transition-opacity duration-500 lg:min-h-[72vh] lg:py-0",
        !active && "lg:opacity-30",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-display grid size-10 place-items-center rounded-full border text-sm font-bold transition-all duration-500",
            active
              ? "border-brand-500/60 bg-brand-500/15 text-brand-200 shadow-[0_0_30px_-4px_rgba(244,103,31,0.8)]"
              : "border-white/15 text-cream-200/60",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-300 uppercase">{step.eyebrow}</p>
      </div>
      <h3
        id={`story-${step.id}`}
        className="font-display mt-5 text-3xl leading-[1.08] font-bold tracking-[-0.025em] text-white sm:text-[2.6rem]"
      >
        {step.title}
      </h3>
      <p className="mt-4 text-lg leading-relaxed text-cream-200/60">{step.body}</p>
      <ul className="mt-6 space-y-3">
        {step.points.map((point) => (
          <li key={point} className="flex gap-3 text-[0.95rem] text-cream-100/80">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-10 lg:hidden">
        <Visual id={step.id} />
      </div>
    </motion.article>
  );
}

export function StickyStory() {
  const [active, setActive] = useState(0);
  const onEnter = useCallback((index: number) => setActive(index), []);

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative isolate scroll-mt-24 pt-28 sm:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-[50rem] bg-[radial-gradient(ellipse_at_30%_50%,rgba(244,103,31,0.12),transparent_60%)]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From one CSV to a finished listing plan"
          body="Four steps. Scroll through them — the screen follows along."
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:pb-28">
        <div className="relative hidden lg:block">
          <div className="sticky top-0 flex h-screen items-center">
            <div className="relative w-full">
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.22),transparent)] blur-2xl"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={STORY[active].id}
                  initial={{ opacity: 0, y: 36, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <Visual id={STORY[active].id} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative lg:pl-12">
          {/* Progress rail: fills as the story moves down. */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 hidden w-px bg-white/10 lg:block">
            <motion.div
              className="w-px origin-top bg-gradient-to-b from-brand-500 to-amber-300 shadow-[0_0_12px_rgba(244,103,31,0.9)]"
              animate={{ height: `${((active + 1) / STORY.length) * 100}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
          {STORY.map((step, index) => (
            <StepText key={step.id} step={step} index={index} active={active === index} onEnter={onEnter} />
          ))}
        </div>
      </div>
    </section>
  );
}
