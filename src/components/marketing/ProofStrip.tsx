/**
 * Capability figures, not vanity metrics: every number here is a property of
 * the tool itself, so none of it can go stale or be untrue.
 */
const FACTS = [
  { value: "∞", label: "levels of niche nesting" },
  { value: "4", label: "filters before you save" },
  { value: "20,000", label: "keywords per import" },
  { value: "0", label: "accounts to create" },
];

export function ProofStrip() {
  return (
    <section aria-label="NicheDesk at a glance" className="border-y border-ink-900/[0.06] bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="text-center md:border-l md:border-ink-900/[0.06] md:first:border-l-0">
              <dt className="sr-only">{fact.label}</dt>
              <dd>
                <span className="font-display block text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
                  {fact.value}
                </span>
                <span className="mt-1 block text-sm font-medium text-ink-500">{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-sm text-ink-500">
          Built around CSV exports from eRank · Exports open in Excel, Google Sheets and Numbers
        </p>
      </div>
    </section>
  );
}
