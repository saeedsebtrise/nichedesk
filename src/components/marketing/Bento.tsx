import { FeatureVisual } from "@/components/marketing/BentoVisuals";
import { FEATURES } from "@/components/marketing/content";
import { ICONS } from "@/components/marketing/icons";
import { Reveal, Spotlight } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

// Spans on the six-column desktop grid, in FEATURES order: 4+2, then 2+2+2, then 3+3.
const SPANS = [
  "md:col-span-2 lg:col-span-4",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
];

export function Bento() {
  return (
    <section id="features" aria-labelledby="bento-title" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="bento-title"
          eyebrow="Features"
          title="Small things that save an afternoon"
          body="The parts you only notice once they are missing from a spreadsheet."
        />

        {/* min-w-0: without it, long no-wrap rows stretch a card past a phone's edge. */}
        <ul className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.icon];
            return (
              <li key={feature.title} className={cn("min-w-0", SPANS[index])}>
                <Reveal delay={(index % 3) * 0.06} className="h-full">
                  <Spotlight className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/15">
                    <div className="relative flex h-full flex-col">
                      <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent)]">
                        <FeatureVisual name={feature.visual} />
                      </div>
                      <div className="relative px-6 pt-2 pb-7 sm:px-8">
                        <h3 className="font-display flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
                          <Icon className="size-5 shrink-0 text-brand-300" />
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-[0.95rem] leading-relaxed text-cream-200/55">{feature.body}</p>
                      </div>
                    </div>
                  </Spotlight>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
