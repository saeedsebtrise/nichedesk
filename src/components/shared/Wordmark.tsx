import Link from "next/link";

import { siteConfig } from "@/config/site";

/** The logo lockup, linking home unless it already is home. */
export function Wordmark({ href = "/", subtitle = true }: { href?: string; subtitle?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-lg font-black text-white shadow-sm transition-transform group-hover:scale-105"
      >
        N
      </span>
      <span>
        <span className="font-display block text-lg leading-tight font-extrabold tracking-tight text-ink-900">
          Niche<span className="text-brand-500">Desk</span>
        </span>
        {subtitle ? (
          <span className="block text-[11px] text-ink-500">Tool by {siteConfig.author}</span>
        ) : null}
      </span>
    </Link>
  );
}
