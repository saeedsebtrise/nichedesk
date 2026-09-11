import Link from "next/link";

import addToNiche from "@/assets/screenshots/add-to-niche.png";
import work from "@/assets/screenshots/work.png";
import { ArrowRight, Check } from "@/components/marketing/icons";
import { FloatingShot, MacbookFrame } from "@/components/marketing/MacbookFrame";
import { siteConfig } from "@/config/site";

const TRUST = ["No signup or login", "Reads eRank CSV exports", "Unlimited niche depth", "Export back to CSV"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-56 left-1/2 -z-10 h-[44rem] w-[80rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(244,103,31,0.20),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-14 text-center sm:pt-20 lg:pt-24">
        <Link
          href="#niche-tree"
          className="group inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 py-1 pr-3 pl-1 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur transition-colors hover:border-brand-300"
        >
          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
            New
          </span>
          Nested subniches — parent to child, any depth
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          id="hero-title"
          className="font-display mx-auto mt-7 max-w-4xl text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-ink-900 sm:text-6xl lg:text-7xl"
        >
          Turn eRank exports into an Etsy niche plan{" "}
          <span className="text-gradient-brand">you can actually work through.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-ink-700 sm:text-xl">
          NicheDesk is the Etsy keyword research organizer for eRank CSVs. Filter a thousand
          keywords down to the ones worth making, file them into a tree of niches and subniches,
          and track each one from pending to done.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={siteConfig.appPath}
            className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-bold text-white shadow-[0_12px_30px_-8px_rgba(244,103,31,0.65)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Open NicheDesk — it is free to use
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center rounded-full border border-ink-900/10 bg-white/80 px-7 py-3.5 text-base font-bold text-ink-900 backdrop-blur transition-colors hover:bg-white"
          >
            See how it works
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink-700">
          {TRUST.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-14 max-w-6xl px-4 pb-20 sm:mt-20 sm:pb-28">
        <div className="relative mx-auto max-w-5xl">
          <MacbookFrame
            src={work}
            alt="NicheDesk Upcoming Work view on a MacBook: stat tiles for total, pending, done and low-competition keywords, filters, competition colour rules, and a keyword table with niche paths such as png › christmas png"
            priority
            sizes="(min-width: 1100px) 1024px, 94vw"
          />

          <FloatingShot
            src={addToNiche}
            alt="The Add to a niche dialog: a searchable niche tree with christmas png selected under png, and a form to create a new subniche nested under png"
            sizes="300px"
            className="float-slow absolute bottom-24 -left-10 hidden w-60 -rotate-3 lg:block xl:-left-24 xl:w-72"
          />

          <div
            aria-hidden="true"
            className="float-slower absolute top-[18%] -right-6 hidden w-72 rounded-2xl bg-white/95 p-4 text-left shadow-[0_30px_60px_-15px_rgba(36,23,15,0.35)] ring-1 ring-ink-900/10 backdrop-blur lg:block xl:-right-16"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">Added 60 keywords</p>
                <p className="mt-0.5 text-xs text-ink-700">
                  to <span className="font-semibold text-brand-600">png › christmas png</span> ·
                  skipped 3 already there
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                ["465", "bg-emerald-800 text-white"],
                ["6,520", "bg-emerald-200 text-emerald-900"],
                ["14,300", "bg-amber-400 text-amber-950"],
                ["930,115", "bg-red-500 text-white"],
              ].map(([value, tone]) => (
                <span key={value} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
