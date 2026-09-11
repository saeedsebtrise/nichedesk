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
 * while the steps scroll past it, and swaps as each step reaches the middle
 * of the screen. On phones each step simply carries its own picture.
 */

function BrowserFrame({ src, alt, children }: { src: StaticImageData; alt: string; children?: ReactNode }) {
  return (
    <div className="relative">
      <MacWindow src={src} alt={alt} compact sizes="(min-width: 1024px) 560px, 92vw" />
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
          <div className="flex items-start gap-3 rounded-2xl border border-l-4 border-cream-200 border-l-emerald-500 bg-white p-3 shadow-xl">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-600 text-sm font-black text-white">✓</span>
            <div>
              <p className="text-sm font-bold text-ink-900">File uploaded successfully</p>
              <p className="text-xs text-ink-700">eRank - Keyword Tool.csv · 1,759 keywords loaded</p>
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
            <span className="rounded-full bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(244,103,31,0.8)]">
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
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-30px_rgba(36,23,15,0.45)] ring-1 ring-ink-900/10">
          <Image
            src={addToNiche}
            alt="The Add to a niche dialog with the niche tree, a Nest under picker and the automatic subniche preview"
            placeholder="blur"
            sizes="(min-width: 1024px) 336px, 88vw"
            className="h-auto w-full"
          />
        </div>
        <Float className="-top-8 -right-4 w-60 sm:-right-14">
          <div className="rounded-2xl bg-night-950 p-4 text-left text-white shadow-2xl ring-1 ring-white/10">
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
        <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-ink-900/10">
          <Image src={colorRules} alt="Competition colour rules" placeholder="blur" sizes="500px" className="h-auto w-full" />
        </div>
      </Float>
    </BrowserFrame>
  );
}

function StepText({ step, index, active, onEnter }: { step: StoryStep; index: number; active: boolean; onEnter: (index: number) => void }) {
  return (
    <motion.article
      onViewportEnter={() => onEnter(index)}
      viewport={{ margin: "-45% 0px -45% 0px" }}
      aria-labelledby={`story-${step.id}`}
      className="flex flex-col justify-center py-12 lg:min-h-[78vh] lg:py-0"
    >
      <p
        className={cn(
          "text-xs font-bold tracking-[0.18em] uppercase transition-colors duration-300",
          active ? "text-brand-600" : "text-ink-500",
        )}
      >
        {String(index + 1).padStart(2, "0")} — {step.eyebrow}
      </p>
      <h3
        id={`story-${step.id}`}
        className="font-display mt-3 text-3xl leading-[1.08] font-extrabold tracking-[-0.025em] text-ink-900 sm:text-4xl"
      >
        {step.title}
      </h3>
      <p className="mt-4 text-lg leading-relaxed text-ink-700">{step.body}</p>
      <ul className="mt-6 space-y-2.5">
        {step.points.map((point) => (
          <li key={point} className="flex gap-3 text-[15px] text-ink-700">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
              <Check className="size-3" strokeWidth={2.6} />
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
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 bg-cream-50">
      <div className="mx-auto max-w-6xl px-4 pt-24 sm:pt-32">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From one CSV to a finished listing plan"
          body="Scroll through the four steps — the screen on the left follows along."
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-32">
        <div className="relative hidden lg:block">
          <div className="sticky top-24 flex h-[calc(100vh-8rem)] items-center">
            <div className="relative w-full">
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

        <div className="relative lg:pl-10">
          {/* Progress rail: fills as the story moves down. */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 hidden w-px bg-cream-300 lg:block">
            <motion.div
              className="w-px origin-top bg-gradient-to-b from-brand-500 to-amber-400"
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
