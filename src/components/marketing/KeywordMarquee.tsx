import { BAND_CLASS, DEFAULT_COMPETITION_RULES, competitionBand } from "@/features/settings/competition";
import { cn } from "@/lib/utils";

/**
 * Two endless strips of keyword chips, coloured by competition exactly as the
 * tool colours them. Decorative, so hidden from screen readers; it pauses
 * under the pointer and stands still for reduced-motion users.
 */

const ROWS: [string, number][][] = [
  [
    ["christmas png", 930115],
    ["later gator png", 465],
    ["crochet pattern", 12783],
    ["wedding invitation", 48210],
    ["ghost png", 4120],
    ["boy mom svg", 1760],
    ["baby shower invitation", 8840],
    ["cozy season shirt", 2410],
    ["teacher appreciation png", 3140],
    ["amigurumi pattern", 356966],
  ],
  [
    ["valentine goose png", 119],
    ["birthday invitation", 21400],
    ["cricut mug svg", 2210],
    ["sewing pattern", 5592315],
    ["watercolor christmas tree png", 1320],
    ["pumpkin spice shirt", 9120],
    ["bridal shower invitation", 6120],
    ["knitting pattern", 829751],
    ["showgirl png", 2657],
    ["funny cat tee", 4480],
  ],
];

function Chip({ keyword, competition }: { keyword: string; competition: number }) {
  const band = competitionBand(competition, DEFAULT_COMPETITION_RULES);
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/[0.05] py-1.5 pr-1.5 pl-3.5 text-sm text-cream-100 ring-1 ring-white/10">
      {keyword}
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", BAND_CLASS[band])}>
        {competition.toLocaleString("en-US")}
      </span>
    </span>
  );
}

export function KeywordMarquee() {
  return (
    <div aria-hidden="true" className="relative overflow-hidden border-y border-white/10 bg-night-950 py-6">
      <div className="marquee-track space-y-3 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {ROWS.map((row, index) => (
          <div key={index} className={cn("marquee flex w-max gap-3", index % 2 === 1 && "marquee-reverse")}>
            {[...row, ...row].map(([keyword, competition], position) => (
              <Chip key={`${keyword}-${position}`} keyword={keyword} competition={competition} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
