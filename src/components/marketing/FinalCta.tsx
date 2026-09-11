import Link from "next/link";

import { ArrowRight, Check } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { siteConfig } from "@/config/site";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          {/* The outer 1px of padding is the border, with a spark running round it. */}
          <div className="beam-border rounded-[2.5rem] bg-white/10 p-px shadow-[0_60px_120px_-40px_rgba(244,103,31,0.45)]">
            <div className="relative isolate overflow-hidden rounded-[calc(2.5rem-1px)] bg-night-900 px-6 py-24 text-center sm:px-16 sm:py-32">
              <div aria-hidden="true" className="absolute inset-0 -z-10">
                {/* A floor grid running off to the horizon. */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 overflow-hidden [perspective:220px] [mask-image:linear-gradient(to_top,black_20%,transparent)]">
                  <div className="absolute inset-0 [transform:rotateX(62deg)]">
                    <div className="retro-grid-lines [margin-left:-50%] h-[300vh] w-[600vw] [transform-origin:100%_0_0]" />
                  </div>
                </div>
                <div className="aurora-blob absolute -top-44 left-1/2 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.42),transparent)] blur-2xl" />
                <div className="bg-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />
              </div>

              <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-b from-brand-400 to-brand-600 text-4xl font-black text-white shadow-[0_0_80px_-8px_rgba(244,103,31,0.95),inset_0_1px_0_rgba(255,255,255,0.4)]">
                N
              </div>

              <h2
                id="cta-title"
                className="font-display mx-auto mt-10 max-w-4xl bg-gradient-to-b from-white from-40% to-white/60 bg-clip-text pb-1 text-[clamp(2.4rem,5.5vw,5rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance text-transparent"
              >
                Your next export deserves better than a spreadsheet.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-cream-200/65">
                Open NicheDesk, drop in the CSV, and watch your niche tree build itself.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={siteConfig.appPath}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_50px_-12px_rgba(244,103,31,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#ff7a36] sm:w-auto"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 blur-md transition-[left] duration-700 group-hover:left-[120%]"
                  />
                  <span className="relative">Open NicheDesk</span>
                  <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#faq"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-bold text-cream-100 backdrop-blur transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  Read the FAQ
                </Link>
              </div>

              <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-200/60">
                {["No signup", "Free to use", "Export anytime"].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-brand-400" strokeWidth={2.4} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
