import addToNiche from "@/assets/screenshots/add-to-niche.png";
import colorRules from "@/assets/screenshots/color-rules.png";
import nicheManager from "@/assets/screenshots/niche-manager.png";
import sort from "@/assets/screenshots/sort.png";
import table from "@/assets/screenshots/table.png";
import { SHOWCASE, type ShowcaseRow } from "@/components/marketing/content";
import { Check } from "@/components/marketing/icons";
import { FloatingShot, MacbookFrame } from "@/components/marketing/MacbookFrame";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

function Visual({ id }: { id: ShowcaseRow["id"] }) {
  if (id === "import") {
    return (
      <MacbookFrame
        src={sort}
        alt="NicheDesk Sort Keyword tab on a MacBook: an eRank CSV of 120 keywords in the import preview, filtered to keywords including png, with all 60 matching rows selected"
        sizes="(min-width: 1024px) 560px, 92vw"
      />
    );
  }

  if (id === "niche-tree") {
    return (
      <div className="relative pr-[14%] pb-[30%]">
        <FloatingShot
          src={nicheManager}
          alt="The niche manager: png with christmas png, christmas tree png, halloween png and teacher png nested beneath it, each showing its own keyword count and the count rolled up from its subniches"
          sizes="(min-width: 1024px) 480px, 80vw"
        />
        <FloatingShot
          src={addToNiche}
          alt="The Add to a niche dialog with the niche tree and a Nest under picker for creating a subniche"
          sizes="(min-width: 1024px) 240px, 40vw"
          className="absolute right-0 bottom-0 w-[40%] rotate-2"
        />
      </div>
    );
  }

  return (
    <div className="relative pb-[9%]">
      <FloatingShot
        src={table}
        alt="The Upcoming Work keyword table: each keyword with its niche path, volume, a competition badge coloured green to red, trend and type dropdowns, and a tick column"
        sizes="(min-width: 1024px) 560px, 92vw"
      />
      <FloatingShot
        src={colorRules}
        alt="Competition color rules: below 5,000 is green, up to 10,000 light green, up to 20,000 orange, and above that red"
        sizes="(min-width: 1024px) 500px, 84vw"
        className="absolute bottom-0 left-[5%] w-[90%] -rotate-1"
      />
    </div>
  );
}

export function Showcase() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Everything between the CSV and the listing"
          body="Three views, one workflow: import and filter, file into your niche tree, then work the queue."
        />

        <div className="mt-20 space-y-28 sm:space-y-36">
          {SHOWCASE.map((row, index) => (
            <article
              key={row.id}
              id={row.id}
              aria-labelledby={`${row.id}-title`}
              className="reveal grid scroll-mt-24 items-center gap-12 lg:grid-cols-2 lg:gap-16"
            >
              <div className={cn(index % 2 === 1 && "lg:order-last")}>
                <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
                  {String(index + 1).padStart(2, "0")} — {row.eyebrow}
                </p>
                <h3
                  id={`${row.id}-title`}
                  className="font-display mt-3 text-3xl leading-[1.08] font-extrabold tracking-[-0.025em] text-ink-900 sm:text-4xl"
                >
                  {row.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-ink-700">{row.body}</p>
                <ul className="mt-7 space-y-3">
                  {row.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[15px] text-ink-700">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                        <Check className="size-3" strokeWidth={2.6} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Visual id={row.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
