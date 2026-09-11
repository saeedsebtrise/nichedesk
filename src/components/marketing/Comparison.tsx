import { COMPARISON } from "@/components/marketing/content";
import { Check, Cross } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-grid size-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
        <Check className="size-4" strokeWidth={2.8} />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-grid size-7 place-items-center rounded-full bg-white/[0.04] text-cream-200/35 ring-1 ring-white/10">
        <Cross className="size-3.5" />
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span>{value}</span>;
}

// On phones each row becomes a card; the column name comes from data-label.
const MOBILE_LABEL =
  "max-md:before:mb-1.5 max-md:before:block max-md:before:text-[10px] max-md:before:font-semibold max-md:before:tracking-[0.14em] max-md:before:uppercase max-md:before:content-[attr(data-label)]";

export function Comparison() {
  return (
    <section id="compare" aria-labelledby="compare-title" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          id="compare-title"
          eyebrow="Why not a spreadsheet?"
          title="A spreadsheet stores keywords. NicheDesk organises them."
        />

        <Reveal className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
            {/* The NicheDesk column glows from its top edge (wide screens). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] bg-gradient-to-b from-brand-500/[0.14] to-brand-500/[0.03] md:block"
            />
            <div aria-hidden="true" className="absolute top-0 right-0 hidden h-px w-[34%] bg-gradient-to-r from-transparent via-brand-400 to-transparent md:block" />

            <table className="relative w-full border-collapse text-left max-md:block">
              <caption className="sr-only">Keyword research tasks compared between a spreadsheet and NicheDesk</caption>
              <thead className="max-md:sr-only">
                <tr className="border-b border-white/10">
                  <th scope="col" className="w-[38%] px-6 py-5 text-xs font-semibold tracking-[0.14em] text-cream-200/40 uppercase">
                    Task
                  </th>
                  <th scope="col" className="w-[28%] px-6 py-5 text-xs font-semibold tracking-[0.14em] text-cream-200/40 uppercase">
                    Spreadsheet
                  </th>
                  <th scope="col" className="px-6 py-5">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                      <span className="grid size-6 place-items-center rounded-md bg-brand-500 text-xs font-black">N</span>
                      NicheDesk
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="max-md:block">
                {COMPARISON.map((row) => (
                  <tr
                    key={row.task}
                    className="border-b border-white/[0.06] last:border-0 max-md:grid max-md:grid-cols-2 max-md:gap-x-3 max-md:gap-y-3 max-md:px-5 max-md:py-5"
                  >
                    <th scope="row" className="px-6 py-5 text-[0.95rem] font-semibold text-white max-md:col-span-2 max-md:p-0">
                      {row.task}
                    </th>
                    <td
                      data-label="Spreadsheet"
                      className={`px-6 py-5 text-sm text-cream-200/50 max-md:p-0 max-md:before:text-cream-200/35 ${MOBILE_LABEL}`}
                    >
                      <Cell value={row.spreadsheet} />
                    </td>
                    <td
                      data-label="NicheDesk"
                      className={`px-6 py-5 text-sm font-semibold text-white max-md:rounded-xl max-md:bg-brand-500/10 max-md:px-3 max-md:py-2.5 max-md:ring-1 max-md:ring-brand-500/25 max-md:before:text-brand-300 ${MOBILE_LABEL}`}
                    >
                      <Cell value={row.nichedesk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
