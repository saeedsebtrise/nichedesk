import Image from "next/image";

import colorRules from "@/assets/screenshots/color-rules.png";
import stats from "@/assets/screenshots/stats.png";
import { FEATURES } from "@/components/marketing/content";
import { ICONS } from "@/components/marketing/icons";
import { Reveal, Spotlight } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

const IMAGES = {
  colorRules: { src: colorRules, alt: "Competition color rules with cut-offs at 5,000, 10,000 and 20,000" },
  stats: { src: stats, alt: "Stat tiles for total, pending, done and low-competition keywords" },
} as const;

export function Bento() {
  return (
    <section id="features" aria-labelledby="bento-title" className="scroll-mt-20 bg-cream-50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="bento-title"
          eyebrow="Features"
          title="Small things that save an afternoon"
          body="The parts you only notice once they are missing from a spreadsheet."
        />

        <ul className="mt-16 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.icon];
            const image = feature.image ? IMAGES[feature.image] : null;

            return (
              <li key={feature.title} className={cn(image && "lg:col-span-2")}>
                <Reveal delay={(index % 3) * 0.08} className="h-full">
                  <Spotlight className="h-full rounded-3xl bg-white p-7 ring-1 ring-ink-900/[0.07] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(36,23,15,0.35)]">
                    <span className="relative grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display relative mt-5 text-xl font-bold tracking-tight text-ink-900">{feature.title}</h3>
                    <p className="relative mt-2 text-[15px] leading-relaxed text-ink-700">{feature.body}</p>
                    {image ? (
                      <div className="relative mt-6 overflow-hidden rounded-2xl ring-1 ring-ink-900/10 transition-transform duration-500 group-hover:-translate-y-1">
                        <Image src={image.src} alt={image.alt} placeholder="blur" sizes="(min-width: 1024px) 680px, 90vw" className="h-auto w-full" />
                      </div>
                    ) : null}
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
