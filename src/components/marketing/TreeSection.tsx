import { Check } from "@/components/marketing/icons";
import { Reveal } from "@/components/marketing/motion";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { TreeCanvas } from "@/components/marketing/TreeCanvas";
import { planSubniches } from "@/features/niches/auto-group";

/**
 * The auto-subniche showcase. The diagram is not drawn by hand: it runs the
 * tool's real grouping over a sample of invitation keywords at build time, so
 * the page shows exactly what NicheDesk would do with them.
 */

const INVITATION_KEYWORDS = [
  "wedding invitation", "wedding invitations", "wedding invitation template", "rustic wedding invitation",
  "boho wedding invitation", "wedding invitation suite", "birthday invitation", "birthday party invitation",
  "kids birthday invitation", "1st birthday invitation", "first birthday invitation", "30th birthday invitation",
  "baby shower invitation", "baby shower invitations boy", "baby shower invitation girl", "bridal shower invitation",
  "bridal shower invitations", "graduation invitation", "graduation party invitation", "christmas party invitation",
  "halloween party invitation", "dinner party invitation", "save the date invitation", "bachelorette party invitation",
  "gender reveal invitation", "baptism invitation", "retirement party invitation", "engagement party invitation",
  "editable invitation", "digital invitation", "printable invitation", "invitation template",
];

const MIN_GROUP_SIZE = 3;

const POINTS = [
  "You see the whole tree before anything is saved",
  "Set how many keywords a subniche needs",
  "A subniche that already exists is reused, never duplicated",
  "Works on a full category later, from the Niches manager",
];

export function TreeSection() {
  const plan = planSubniches(INVITATION_KEYWORDS, "Invitation", { minGroupSize: MIN_GROUP_SIZE });
  const branches = plan.groups.map((group) => ({
    name: group.name,
    count: group.members.length,
    samples: group.members.slice(0, 3).map((index) => INVITATION_KEYWORDS[index]),
  }));

  return (
    <section
      id="niche-tree"
      aria-labelledby="tree-title"
      className="relative isolate scroll-mt-20 overflow-hidden bg-night-950 text-white"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="aurora-blob absolute top-10 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.22),transparent)] blur-3xl" />
        <div className="bg-grid-light absolute inset-0 opacity-50" />
        <div className="bg-noise absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="tree-title"
          tone="dark"
          eyebrow="Auto subniches"
          title="Drop in one category. Get the whole umbrella."
          body="Send your keywords into a category like “Invitation” and NicheDesk splits them into subniches on its own — by the words they share. This is the tool’s real grouping, run on 32 invitation keywords."
        />

        <div className="mt-16">
          <TreeCanvas
            root="Invitation"
            total={INVITATION_KEYWORDS.length}
            branches={branches}
            stay={plan.rest.length}
            minGroupSize={MIN_GROUP_SIZE}
          />
        </div>

        <Reveal className="mt-14">
          <ul className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3 rounded-xl bg-white/[0.035] px-4 py-3 text-sm text-cream-100 ring-1 ring-white/10">
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
