import Link from "next/link";

import { HeroShowcase } from "@/components/marketing/HeroShowcase";
import { ArrowRight, Check } from "@/components/marketing/icons";
import { Reveal, WordReveal } from "@/components/marketing/motion";
import { siteConfig } from "@/config/site";

const TRUST = ["No signup", "Reads eRank CSV exports", "Auto subniches", "Export back to CSV"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* A cone of light over the headline, drifting glow, a fading grid and grain. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-10 left-1/2 h-[50rem] w-[110rem] max-w-none -translate-x-1/2 bg-[conic-gradient(at_50%_0%,transparent_155deg,rgba(244,103,31,0.3)_173deg,rgba(255,200,160,0.45)_180deg,rgba(244,103,31,0.3)_187deg,transparent_205deg)] blur-2xl [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="aurora-blob absolute -top-48 left-[6%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.38),transparent)] blur-2xl" />
        <div className="aurora-blob absolute top-10 right-[2%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,154,61,0.22),transparent)] blur-2xl [animation-delay:-7s]" />
        <div className="bg-grid-light absolute inset-0 opacity-60" />
        <div className="bg-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-night-950" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pt-36 text-center sm:px-8 sm:pt-44">
        <Reveal y={10}>
          <Link
            href="#niche-tree"
            className="beam-border group inline-flex items-center gap-2.5 rounded-full bg-white/[0.05] py-1.5 pr-4 pl-1.5 text-sm font-medium text-cream-100 backdrop-blur transition-colors hover:bg-white/[0.09]"
          >
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">New</span>
            <span className="max-sm:hidden">Auto subniches — one category, the whole umbrella</span>
            <span className="sm:hidden">Auto subniches are here</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <h1
          id="hero-title"
          className="font-display mx-auto mt-8 max-w-6xl text-[clamp(2.6rem,7vw,6.25rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
        >
          <WordReveal
            text="Turn eRank exports into an Etsy niche tree"
            className="bg-gradient-to-b from-white to-white/65 bg-clip-text pb-2 text-transparent"
          />{" "}
          <WordReveal text="that sorts itself." delay={0.5} className="text-shimmer pb-2" />
        </h1>

        <Reveal delay={0.55}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-cream-200/65 sm:text-xl">
            NicheDesk is the Etsy keyword research organizer for eRank CSVs. Upload an export, filter a thousand
            keywords down to the ones worth making, drop them into a category — and watch the subniches build
            themselves.
          </p>
        </Reveal>

        <Reveal delay={0.7}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={siteConfig.appPath}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-500 px-7 py-4 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_0_1px_rgba(244,103,31,0.6),0_18px_50px_-12px_rgba(244,103,31,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#ff7a36] sm:w-auto"
            >
              {/* Sheen that sweeps across on hover. */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 blur-md transition-[left] duration-700 group-hover:left-[120%]"
              />
              <span className="relative">Open NicheDesk — free to use</span>
              <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-7 py-4 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/[0.08] sm:w-auto"
            >
              See how it works
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.85}>
          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-200/55">
            {TRUST.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand-400" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <HeroShowcase />
    </section>
  );
}
