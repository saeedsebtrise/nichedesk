import Link from "next/link";

import { FAQS } from "@/components/marketing/content";
import { ArrowRight } from "@/components/marketing/icons";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { siteConfig } from "@/config/site";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            id="faq-title"
            align="left"
            size="md"
            eyebrow="FAQ"
            title="Questions sellers ask"
            body="Anything else? The fastest answer is usually to open the tool and drop in a CSV."
          />
          <div className="mt-8 rounded-2xl border border-brand-500/25 bg-gradient-to-br from-brand-500/15 to-transparent p-6">
            <p className="font-semibold text-white">Still deciding?</p>
            <p className="mt-1 text-sm text-cream-200/60">Trying it with your own export is quicker than reading about it.</p>
            <Link
              href={siteConfig.appPath}
              className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-300 hover:text-brand-200"
            >
              Open NicheDesk
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="faq-item group rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/15 open:border-brand-500/30 open:bg-white/[0.04]"
            >
              <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-lg font-semibold tracking-tight text-white [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="relative grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-cream-100 transition-all duration-300 group-open:rotate-45 group-open:border-brand-500/40 group-open:bg-brand-500/15 group-open:text-brand-200"
                >
                  <span className="absolute h-3 w-px bg-current" />
                  <span className="absolute h-px w-3 bg-current" />
                </span>
              </summary>
              <p className="faq-answer max-w-3xl px-6 pb-6 text-base leading-relaxed text-cream-200/60">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
