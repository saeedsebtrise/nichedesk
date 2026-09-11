import type { ReactNode } from "react";

import { CountUp, Reveal } from "@/components/marketing/motion";

/**
 * Capability figures, not vanity metrics: every number is a property of the
 * tool itself, so none of it can go stale or be untrue.
 */
const FACTS: { label: string; value: ReactNode }[] = [
  { label: "levels of niche nesting", value: "∞" },
  { label: "filters before you save", value: <CountUp value={4} /> },
  { label: "keywords per import", value: <CountUp value={20000} /> },
  { label: "accounts to create", value: "0" },
];

export function ProofStrip() {
  return (
    <section aria-label="NicheDesk at a glance" className="pb-28 sm:pb-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          {/* 1px gaps over a lighter fill draw the dividers between the cells. */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse bg-night-950 p-5 sm:p-10">
                <dt className="mt-3 text-sm font-medium text-cream-200/50">{fact.label}</dt>
                {/* Scales with the screen so "20,000" fits a half-width cell on a phone. */}
                <dd className="font-display bg-gradient-to-b from-white to-white/45 bg-clip-text text-[clamp(2rem,8vw,3.75rem)] leading-none font-extrabold tracking-tight text-transparent tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
