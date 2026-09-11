import { COMPARISON } from "@/components/marketing/content";
import { Check, Cross } from "@/components/marketing/icons";
import { SectionHeading } from "@/components/marketing/SectionHeading";

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
        <Check className="size-5" strokeWidth={2.4} />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center text-ink-500/60">
        <Cross className="size-5" />
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span className={highlight ? "font-semibold text-ink-900" : "text-ink-700"}>{value}</span>;
}

export function Comparison() {
  return (
    <section
      id="compare"
      aria-labelledby="compare-title"
      className="scroll-mt-20 border-t border-ink-900/[0.06] bg-white/60"
    >
      <div className="mx-auto max-w-5xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="compare-title"
          eyebrow="Why not a spreadsheet?"
          title="A spreadsheet stores keywords. NicheDesk organises them."
        />

        <div className="reveal mt-14 overflow-x-auto rounded-3xl bg-white shadow-[0_30px_60px_-30px_rgba(36,23,15,0.25)] ring-1 ring-ink-900/[0.08]">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[15px]">
            <caption className="sr-only">
              Keyword research tasks compared between a spreadsheet and NicheDesk
            </caption>
            <thead>
              <tr className="border-b border-ink-900/[0.08]">
                <th scope="col" className="px-6 py-5 text-sm font-semibold text-ink-500">
                  Task
                </th>
                <th scope="col" className="px-6 py-5 text-sm font-semibold text-ink-500">
                  Spreadsheet
                </th>
                <th scope="col" className="bg-brand-50 px-6 py-5 text-sm font-bold text-brand-700">
                  NicheDesk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/[0.06]">
              {COMPARISON.map((row) => (
                <tr key={row.task}>
                  <th scope="row" className="px-6 py-4 font-semibold text-ink-900">
                    {row.task}
                  </th>
                  <td className="px-6 py-4">
                    <Cell value={row.spreadsheet} />
                  </td>
                  <td className="bg-brand-50/60 px-6 py-4">
                    <Cell value={row.nichedesk} highlight />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
