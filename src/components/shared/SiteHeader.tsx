import Link from "next/link";

import { ArrowRight } from "@/components/marketing/icons";
import { Wordmark } from "@/components/shared/Wordmark";
import { siteConfig } from "@/config/site";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#niche-tree", label: "Niche tree" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#guide", label: "Guide" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/[0.06] bg-cream-50/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Wordmark />

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={siteConfig.appPath}
          className="group ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ink-700 lg:ml-0"
        >
          Open the tool
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
