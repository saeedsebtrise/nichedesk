import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** The logo lockup, linking home. `tone="dark"` is for use on dark backgrounds. */
export function Wordmark({
  href = "/",
  subtitle = true,
  tone = "light",
}: {
  href?: string;
  subtitle?: boolean;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <Link href={href} className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-lg font-black text-white shadow-sm transition-transform group-hover:scale-105"
      >
        N
      </span>
      <span>
        <span
          className={cn(
            "font-display block text-lg leading-tight font-extrabold tracking-tight",
            dark ? "text-white" : "text-ink-900",
          )}
        >
          Niche<span className="text-brand-500">Desk</span>
        </span>
        {subtitle ? (
          <span className={cn("block text-[11px]", dark ? "text-cream-200/60" : "text-ink-500")}>
            Tool by {siteConfig.author}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
