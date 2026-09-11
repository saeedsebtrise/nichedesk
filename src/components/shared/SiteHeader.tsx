import Link from "next/link";

import { ArrowRight } from "@/components/marketing/icons";
import { Wordmark } from "@/components/shared/Wordmark";
import { siteConfig } from "@/config/site";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#niche-tree", label: "Auto subniches" },
  { href: "#features", label: "Features" },
  { href: "#guide", label: "Guide" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night-950/90 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Wordmark tone="dark" />

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-cream-200/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={siteConfig.appPath}
          className="group ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-900 shadow-sm transition-colors hover:bg-cream-100 lg:ml-0"
        >
          Open the tool
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
