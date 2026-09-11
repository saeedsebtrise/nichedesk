import Link from "next/link";

import { ArrowRight, Check } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { siteConfig } from "@/config/site";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-cream-50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-28">
        <Reveal>
          {/* A light sweeping around the border, drawn by a spinning gradient behind a 1px gap. */}
          <div className="relative overflow-hidden rounded-[2rem] p-px shadow-2xl">
            <div
              aria-hidden="true"
              className="spin-slow absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,#f4671f_50deg,#ffab7d_80deg,transparent_140deg,transparent_360deg)]"
            />
            <div className="relative isolate overflow-hidden rounded-[calc(2rem-1px)] bg-night-950 px-6 py-16 text-center sm:px-16 sm:py-24">
              <div aria-hidden="true" className="absolute inset-0 -z-10">
                <div className="aurora-blob absolute -bottom-48 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.5),transparent)] blur-2xl" />
                <div className="bg-grid-light absolute inset-0" />
              </div>

              <h2
                id="cta-title"
                className="font-display mx-auto max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-white sm:text-6xl"
              >
                Your next export deserves better than a spreadsheet.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-cream-200/80">
                Open NicheDesk, drop in the CSV, and watch your niche tree build itself.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={siteConfig.appPath}
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-[0_14px_44px_-8px_rgba(244,103,31,0.85)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  Open NicheDesk
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#faq"
                  className="inline-flex items-center rounded-full px-8 py-4 text-base font-bold text-cream-100 ring-1 ring-white/20 transition-colors hover:bg-white/10"
                >
                  Read the FAQ
                </Link>
              </div>

              <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-200/70">
                {["No signup", "Free to use", "Your data stays yours"].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-brand-300" />
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
