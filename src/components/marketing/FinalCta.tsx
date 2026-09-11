import Link from "next/link";

import { ArrowRight, Check } from "@/components/marketing/icons";
import { siteConfig } from "@/config/site";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-28">
        <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-16 text-center shadow-2xl sm:px-16 sm:py-24">
          <div aria-hidden="true" className="bg-grid-light absolute inset-0 -z-10" />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 left-1/2 -z-10 h-[30rem] w-[50rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(244,103,31,0.45),transparent)]"
          />

          <h2
            id="cta-title"
            className="font-display mx-auto max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-white sm:text-6xl"
          >
            Your next export deserves better than a spreadsheet.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream-200/80">
            Open NicheDesk, drop in the CSV, and have your first niche tree in minutes.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={siteConfig.appPath}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-[0_12px_40px_-8px_rgba(244,103,31,0.8)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
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
            {["No signup", "No login", "Your data stays yours"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
