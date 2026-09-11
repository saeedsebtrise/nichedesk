import { CountUp, Reveal } from "@/components/marketing/motion";

/**
 * Capability figures, not vanity metrics: every number is a property of the
 * tool itself, so none of it can go stale or be untrue.
 */
export function ProofStrip() {
  return (
    <section aria-label="NicheDesk at a glance" className="bg-night-950 pb-20 text-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pt-14 md:grid-cols-4">
        {[
          { label: "levels of niche nesting", value: <span>∞</span> },
          { label: "filters before you save", value: <CountUp value={4} /> },
          { label: "keywords per import", value: <CountUp value={20000} /> },
          { label: "accounts to create", value: <span>0</span> },
        ].map((fact, index) => (
          <Reveal key={fact.label} delay={index * 0.08}>
            <div className="rounded-2xl bg-white/[0.035] p-6 text-center ring-1 ring-white/10">
              <dt className="sr-only">{fact.label}</dt>
              <dd>
                <span className="font-display block bg-gradient-to-b from-white to-cream-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  {fact.value}
                </span>
                <span className="mt-2 block text-sm font-medium text-cream-200/60">{fact.label}</span>
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
