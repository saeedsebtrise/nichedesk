import { STEPS } from "@/components/marketing/content";
import { SectionHeading } from "@/components/marketing/SectionHeading";

export function Steps() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From export to listing in three steps"
        />

        <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
          {/* The connector between the step numbers, on wide screens only. */}
          <div
            aria-hidden="true"
            className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-brand-300/70 md:block"
          />
          {STEPS.map((step, index) => (
            <li key={step.title} className="reveal relative text-center">
              <span className="font-display relative mx-auto grid size-14 place-items-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-white shadow-[0_12px_30px_-8px_rgba(244,103,31,0.6)]">
                {index + 1}
              </span>
              <h3 className="font-display mt-6 text-xl font-bold tracking-tight text-ink-900">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink-700">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
