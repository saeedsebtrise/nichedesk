import { GUIDE } from "@/components/marketing/content";
import { SectionHeading } from "@/components/marketing/SectionHeading";

/**
 * The long-form guide. It earns its place for readers first — it explains the
 * method behind the tool — and it is also the densest, most topical text on
 * the page, which is what search engines rank on.
 */
export function Guide() {
  return (
    <section id="guide" aria-labelledby="guide-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:py-32 lg:grid-cols-[18rem_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="guide-title"
            align="left"
            eyebrow="Guide"
            title="Etsy keyword research that does not end in a spreadsheet"
          />
          <nav aria-label="In this guide" className="mt-8 hidden lg:block">
            <ol className="space-y-2 border-l border-ink-900/10 text-sm">
              {GUIDE.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#guide-${index + 1}`}
                    className="-ml-px block border-l border-transparent py-1 pl-4 text-ink-500 transition-colors hover:border-brand-500 hover:text-ink-900"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="space-y-14">
          {GUIDE.map((section, index) => (
            <div key={section.heading} id={`guide-${index + 1}`} className="scroll-mt-28">
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {section.heading}
              </h3>
              <div className="mt-4 space-y-4 text-[17px] leading-[1.75] text-ink-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
