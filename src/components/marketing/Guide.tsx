import { GUIDE } from "@/components/marketing/content";
import { GuideToc } from "@/components/marketing/GuideToc";
import { Reveal } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";

/**
 * The long-form guide. It earns its place for readers first — it explains the
 * method behind the tool — and it is also the densest, most topical text on
 * the page, which is what search engines rank on.
 */
export function Guide() {
  const toc = GUIDE.map((section, index) => ({ id: `guide-${index + 1}`, label: section.heading }));

  return (
    <section id="guide" aria-labelledby="guide-title" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            id="guide-title"
            align="left"
            size="md"
            eyebrow="Guide"
            title="Etsy keyword research that does not end in a spreadsheet"
          />
          <GuideToc items={toc} />
        </div>

        <div className="space-y-5">
          {GUIDE.map((section, index) => (
            <Reveal key={section.heading}>
              <article
                id={`guide-${index + 1}`}
                className="scroll-mt-32 rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-7 sm:p-10"
              >
                <p
                  aria-hidden="true"
                  className="font-display bg-gradient-to-b from-brand-300 to-brand-600 bg-clip-text text-5xl leading-none font-extrabold text-transparent"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {section.heading}
                </h3>
                <div className="mt-5 space-y-4 text-[1.05rem] leading-[1.8] text-cream-200/65">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
