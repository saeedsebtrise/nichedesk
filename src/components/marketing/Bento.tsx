import Image from "next/image";

import colorRules from "@/assets/screenshots/color-rules.png";
import stats from "@/assets/screenshots/stats.png";
import { FEATURES } from "@/components/marketing/content";
import { ICONS } from "@/components/marketing/icons";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

const IMAGES = {
  colorRules: {
    src: colorRules,
    alt: "Competition color rules with cut-offs at 5,000, 10,000 and 20,000",
  },
  stats: {
    src: stats,
    alt: "Stat tiles reading 39 total keywords, 34 pending, 5 done and 18 low competition still open",
  },
} as const;

export function Bento() {
  return (
    <section
      aria-labelledby="bento-title"
      className="relative isolate overflow-hidden bg-ink-900 text-cream-50"
    >
      <div aria-hidden="true" className="bg-grid-light absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-40 right-0 -z-10 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(244,103,31,0.28),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="bento-title"
          tone="dark"
          eyebrow="The details"
          title="Small things that save an afternoon"
          body="The parts you only notice once they are missing from a spreadsheet."
        />

        <ul className="mt-16 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            const image = feature.image ? IMAGES[feature.image] : null;

            return (
              <li
                key={feature.title}
                className={cn(
                  "reveal group relative flex flex-col overflow-hidden rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 transition-colors hover:bg-white/[0.07]",
                  image && "lg:col-span-2",
                )}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display mt-5 text-xl font-bold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cream-200/75">{feature.body}</p>

                {image ? (
                  <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-white/20">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      placeholder="blur"
                      sizes="(min-width: 1024px) 680px, 90vw"
                      className="h-auto w-full"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
