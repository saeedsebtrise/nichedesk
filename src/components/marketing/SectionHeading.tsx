import { cn } from "@/lib/utils";

/** Eyebrow pill, gradient headline and lede — the opening of every section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  align = "center",
  size = "lg",
}: {
  id: string;
  eyebrow: string;
  title: string;
  body?: string;
  align?: "center" | "left";
  /** `md` for headings that sit in a narrow side column. */
  size?: "lg" | "md";
}) {
  const center = align === "center";

  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-brand-200 uppercase backdrop-blur">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-brand-400 shadow-[0_0_12px_3px_rgba(251,138,75,0.6)]"
        />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          "font-display mt-6 bg-gradient-to-b from-white from-40% to-white/55 bg-clip-text pb-1 font-extrabold tracking-[-0.035em] text-balance text-transparent",
          size === "lg" ? "text-[clamp(2.25rem,4.6vw,4.25rem)] leading-[1.02]" : "text-[clamp(2rem,3vw,2.9rem)] leading-[1.05]",
        )}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed text-pretty text-cream-200/60",
            size === "lg" && "sm:text-xl",
            center && "mx-auto max-w-2xl",
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
