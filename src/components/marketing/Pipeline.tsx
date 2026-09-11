import { ICONS, type IconName } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";

/**
 * What goes in, what comes out: three sources feeding NicheDesk and three
 * results leaving it, joined by connectors with light running along them.
 * Drawn as one SVG (the beams) under absolutely placed cards; the card rows
 * and the beam end points share the same coordinates, so they always meet.
 */

type PipelineNode = { icon: IconName; title: string; meta: string };

const INPUTS: PipelineNode[] = [
  { icon: "upload", title: "eRank CSV export", meta: "1,759 rows, any plan" },
  { icon: "list", title: "Keywords you add", meta: "one at a time, by hand" },
  { icon: "refresh", title: "Next week’s export", meta: "only new rows go in" },
];

const OUTPUTS: PipelineNode[] = [
  { icon: "tree", title: "Niche tree", meta: "subniches, built for you" },
  { icon: "layers", title: "Work queue", meta: "colour-coded, ticked, done" },
  { icon: "download", title: "CSV export", meta: "full niche path on every row" },
];

// Diagram space: cards sit at these heights (percent), beams use the same.
const WIDTH = 1000;
const HEIGHT = 460;
const ROWS = [18, 50, 82];
const rowY = (row: number) => (row / 100) * HEIGHT;

const BEAMS = [
  ...ROWS.map((row) => `M250 ${rowY(row)} C350 ${rowY(row)} 330 230 430 230`),
  ...ROWS.map((row) => `M570 230 C670 230 650 ${rowY(row)} 750 ${rowY(row)}`),
];

function Node({ node }: { node: PipelineNode }) {
  const Icon = ICONS[node.icon];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-night-900/85 p-3.5 pr-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-brand-300 ring-1 ring-white/10">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate font-semibold text-white">{node.title}</span>
        <span className="block truncate text-xs text-cream-200/50">{node.meta}</span>
      </span>
    </div>
  );
}

function CoreTile({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span aria-hidden="true" className="pulse-ring absolute inset-0 rounded-[28%] border border-brand-500/50" />
      <span
        aria-hidden="true"
        className="pulse-ring absolute inset-0 rounded-[28%] border border-brand-500/40 [animation-delay:1.4s]"
      />
      <div className="beam-border relative grid size-full place-items-center rounded-[28%] bg-gradient-to-b from-[#2b1a10] to-night-950 shadow-[0_0_90px_-10px_rgba(244,103,31,0.75)] ring-1 ring-white/10">
        <span className="font-display bg-gradient-to-b from-[#ffd6b5] to-brand-500 bg-clip-text text-[clamp(2rem,4.2vw,3.75rem)] font-black text-transparent">
          N
        </span>
      </div>
    </div>
  );
}

function VerticalBeam() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-12 w-px overflow-hidden bg-white/10">
      <span className="beam-drop absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-brand-300 to-transparent" />
    </div>
  );
}

export function Pipeline() {
  return (
    <section id="pipeline" aria-labelledby="pipeline-title" className="relative scroll-mt-24 pt-28 pb-20 sm:pt-36 sm:pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="pipeline-title"
          eyebrow="The pipeline"
          title="One export in. A whole plan out."
          body="NicheDesk sits between your keyword research and your listings: it takes the raw export and hands back something you can actually work through."
        />

        <ol className="sr-only">
          <li>In: an eRank CSV export, keywords you add by hand, and next week’s export — only new rows are added.</li>
          <li>NicheDesk filters, groups and sorts them.</li>
          <li>Out: a niche tree with subniches, a colour-coded work queue, and a CSV export.</li>
        </ol>

        <Reveal className="mt-16 sm:mt-20">
          {/* Wide screens: the full diagram. */}
          <div aria-hidden="true" className="relative mx-auto hidden aspect-[1000/460] max-w-6xl lg:block">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 size-full">
              <defs>
                <filter id="beam-glow" filterUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>
              {BEAMS.map((d, index) => (
                <g key={d}>
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
                  <path
                    d={d}
                    pathLength={200}
                    fill="none"
                    stroke="#f4671f"
                    strokeWidth={9}
                    strokeLinecap="round"
                    filter="url(#beam-glow)"
                    className="beam-path"
                    style={{ animationDelay: `${index * 0.4}s` }}
                  />
                  <path
                    d={d}
                    pathLength={200}
                    fill="none"
                    stroke="#ffd2b0"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    className="beam-path"
                    style={{ animationDelay: `${index * 0.4}s` }}
                  />
                </g>
              ))}
            </svg>

            {INPUTS.map((node, index) => (
              <div key={node.title} className="absolute left-0 w-1/4 -translate-y-1/2" style={{ top: `${ROWS[index]}%` }}>
                <Node node={node} />
              </div>
            ))}
            {OUTPUTS.map((node, index) => (
              <div key={node.title} className="absolute right-0 w-1/4 -translate-y-1/2" style={{ top: `${ROWS[index]}%` }}>
                <Node node={node} />
              </div>
            ))}

            <div className="absolute top-1/2 left-1/2 w-[14%] -translate-x-1/2 -translate-y-1/2">
              <CoreTile className="relative aspect-square" />
              <p className="absolute top-full left-1/2 mt-4 -translate-x-1/2 text-center whitespace-nowrap">
                <span className="block font-semibold text-white">NicheDesk</span>
                <span className="block text-xs text-cream-200/50">filter · group · sort</span>
              </p>
            </div>
          </div>

          {/* Phones and tablets: the same story, stacked. */}
          <div aria-hidden="true" className="mx-auto max-w-md lg:hidden">
            <div className="space-y-3">
              {INPUTS.map((node) => (
                <Node key={node.title} node={node} />
              ))}
            </div>
            <VerticalBeam />
            <div className="flex items-center gap-4 rounded-2xl border border-brand-500/30 bg-night-900 p-4 shadow-[0_0_60px_-15px_rgba(244,103,31,0.7)]">
              <CoreTile className="relative size-16 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-white">NicheDesk</p>
                <p className="text-sm text-cream-200/55">filters, groups and sorts it all</p>
              </div>
            </div>
            <VerticalBeam />
            <div className="space-y-3">
              {OUTPUTS.map((node) => (
                <Node key={node.title} node={node} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
