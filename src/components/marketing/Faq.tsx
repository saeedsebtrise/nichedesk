import Link from "next/link";

import { FAQS } from "@/components/marketing/content";
import { ArrowRight } from "@/components/marketing/icons";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { siteConfig } from "@/config/site";

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-20 border-t border-ink-900/[0.06] bg-white/60"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:py-32 lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="faq-title"
            align="left"
            eyebrow="FAQ"
            title="Questions sellers ask"
            body="Anything else? The fastest answer is usually to open the tool and drop in a CSV."
          />
          <Link
            href={siteConfig.appPath}
            className="group mt-8 inline-flex items-center gap-2 text-base font-bold text-brand-600 hover:text-brand-700"
          >
            Open NicheDesk
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-ink-900/[0.08] border-y border-ink-900/[0.08]">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-6">
              <summary className="font-display flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-bold tracking-tight text-ink-900 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-cream-200 text-lg text-brand-700 transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-700">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
