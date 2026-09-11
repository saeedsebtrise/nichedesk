import Link from "next/link";

import work from "@/assets/screenshots/work.png";
import { FlowDiagram } from "@/components/marketing/FlowDiagram";
import { ArrowRight, Check } from "@/components/marketing/icons";
import { MacbookFrame } from "@/components/marketing/MacbookFrame";
import { Reveal, ScrollTilt, WordReveal } from "@/components/marketing/motion";
import { siteConfig } from "@/config/site";

const TRUST = ["No signup", "Reads eRank CSV exports", "Auto subniches", "Export back to CSV"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-night-950 text-white">
      {/* Drifting light, a grid that fades out, and film grain. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob absolute -top-[18rem] left-[5%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.55),transparent)] blur-2xl" />
        <div className="aurora-blob absolute -top-40 right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,154,61,0.32),transparent)] blur-2xl [animation-delay:-6s]" />
        <div className="aurora-blob absolute top-[38%] left-[35%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(226,86,15,0.28),transparent)] blur-3xl [animation-delay:-12s]" />
        <div className="bg-grid-light absolute inset-0 opacity-70" />
        <div className="bg-noise absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 text-center sm:pt-24">
        <Reveal y={10}>
          <Link
            href="#niche-tree"
            className="group inline-flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pr-3 pl-1 text-xs font-semibold text-cream-100 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/10"
          >
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">New</span>
            Auto subniches — one category, the whole umbrella
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <h1
          id="hero-title"
          className="font-display mx-auto mt-7 max-w-5xl text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[5rem]"
        >
          <WordReveal text="Turn eRank exports into an Etsy niche tree" />{" "}
          <WordReveal text="that sorts itself." delay={0.5} className="text-gradient-brand pb-1" />
        </h1>

        <Reveal delay={0.55}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-cream-200/75 sm:text-xl">
            NicheDesk is the Etsy keyword research organizer for eRank CSVs. Upload an export, filter a thousand
            keywords down to the ones worth making, drop them into a category — and watch the subniches build
            themselves.
          </p>
        </Reveal>

        <Reveal delay={0.7}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={siteConfig.appPath}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_14px_40px_-8px_rgba(244,103,31,0.8)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Open NicheDesk — free to use
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center rounded-full bg-white/[0.06] px-7 py-3.5 text-base font-bold text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/10"
            >
              See it work ↓
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.85}>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-cream-200/70">
            {TRUST.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand-300" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-4 sm:mt-20">
        <FlowDiagram />
      </div>

      <div className="relative mx-auto mt-14 max-w-5xl px-4 pb-24 sm:mt-20 sm:pb-32">
        <div
          aria-hidden="true"
          className="absolute inset-x-[10%] top-[20%] bottom-[10%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.35),transparent)] blur-3xl"
        />
        <ScrollTilt>
          <MacbookFrame
            src={work}
            alt="NicheDesk Upcoming Work view on a MacBook: stat tiles, filters, competition colour rules, and a keyword table with niche paths such as png › christmas png"
            priority
            sizes="(min-width: 1100px) 1024px, 94vw"
          />
        </ScrollTilt>
      </div>
    </section>
  );
}
