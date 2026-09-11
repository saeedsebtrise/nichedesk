import { Check } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { TreeExplorer, type SampleTree } from "@/components/marketing/TreeCanvas";
import { planSubniches } from "@/features/niches/auto-group";

/**
 * The auto-subniche showcase. None of the trees is drawn by hand: each one is
 * the tool's real grouping, run on a sample of keywords at build time, so the
 * page shows exactly what NicheDesk would do with them.
 */

const SAMPLES: { id: string; root: string; keywords: string[] }[] = [
  {
    id: "invitation",
    root: "Invitation",
    keywords: [
      "wedding invitation", "wedding invitations", "wedding invitation template", "rustic wedding invitation",
      "boho wedding invitation", "wedding invitation suite", "birthday invitation", "birthday party invitation",
      "kids birthday invitation", "1st birthday invitation", "first birthday invitation", "30th birthday invitation",
      "baby shower invitation", "baby shower invitations boy", "baby shower invitation girl", "bridal shower invitation",
      "bridal shower invitations", "graduation invitation", "graduation party invitation", "christmas party invitation",
      "halloween party invitation", "dinner party invitation", "save the date invitation", "bachelorette party invitation",
      "gender reveal invitation", "baptism invitation", "retirement party invitation", "engagement party invitation",
      "editable invitation", "digital invitation", "printable invitation", "invitation template",
    ],
  },
  {
    id: "png",
    root: "PNG",
    keywords: [
      "christmas png", "christmas tree png", "christmas gnome png", "christmas sublimation png", "retro christmas png",
      "halloween png", "halloween ghost png", "spooky halloween png", "halloween sublimation png", "teacher png",
      "teacher appreciation png", "teacher life png", "mama png", "mama sublimation png", "boy mama png",
      "dog mama png", "retro png", "retro groovy png", "retro sunset png", "back to school png", "cat png",
      "cowgirl png", "boho png", "floral png", "valentine png", "easter bunny png", "png bundle", "png designs",
    ],
  },
  {
    id: "shirt",
    root: "Shirt",
    keywords: [
      "dad shirt", "best dad shirt", "dad joke shirt", "funny dad shirt", "mom shirt", "boy mom shirt",
      "dog mom shirt", "christmas shirt", "christmas family shirt", "matching christmas shirt", "fall shirt",
      "fall vibes shirt", "fall season shirt", "teacher shirt", "teacher appreciation shirt", "teacher life shirt",
      "funny cat shirt", "pumpkin spice shirt", "thanksgiving shirt", "birthday girl shirt", "nurse life shirt",
      "vintage shirt", "oversized shirt", "comfort colors shirt", "graphic tee shirt",
    ],
  },
];

const MIN_GROUP_SIZE = 3;

const POINTS = [
  "You see the whole tree before anything is saved",
  "Set how many keywords a subniche needs",
  "A subniche that already exists is reused, never duplicated",
  "Works on a full category later, from the Niches manager",
];

export function TreeSection() {
  const trees: SampleTree[] = SAMPLES.map(({ id, root, keywords }) => {
    const plan = planSubniches(keywords, root, { minGroupSize: MIN_GROUP_SIZE });
    return {
      id,
      root,
      total: keywords.length,
      stay: plan.rest.length,
      branches: plan.groups.map((group) => ({
        name: group.name,
        count: group.members.length,
        samples: group.members.slice(0, 3).map((index) => keywords[index]),
      })),
    };
  });

  return (
    <section
      id="niche-tree"
      aria-labelledby="tree-title"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-white/[0.06] bg-white/[0.012]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="aurora-blob absolute top-10 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.22),transparent)] blur-3xl" />
        <div className="bg-grid-light absolute inset-0 opacity-50" />
        <div className="bg-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-36">
        <SectionHeading
          id="tree-title"
          eyebrow="Auto subniches"
          title="Drop in one category. Get the whole umbrella."
          body="Send keywords into a category and NicheDesk splits them into subniches on its own, by the words they share. Pick a category — every tree below is the tool’s real grouping, run on sample keywords."
        />

        <div className="mt-14">
          <TreeExplorer trees={trees} minGroupSize={MIN_GROUP_SIZE} />
        </div>

        <Reveal className="mt-16">
          <ul className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-cream-100"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand-300" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
