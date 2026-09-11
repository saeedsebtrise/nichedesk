import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  tone = "light",
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: string;
  body?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  const dark = tone === "dark";

  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p
        className={cn(
          "inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase",
          dark ? "text-brand-300" : "text-brand-600",
        )}
      >
        <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          "font-display mt-3 text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl",
          dark ? "text-white" : "text-ink-900",
        )}
      >
        {title}
      </h2>
      {body ? (
        <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-cream-200/80" : "text-ink-700")}>
          {body}
        </p>
      ) : null}
    </div>
  );
}
