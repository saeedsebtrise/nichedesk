import Link from "next/link";

import { Wordmark } from "@/components/shared/Wordmark";
import { siteConfig } from "@/config/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#niche-tree", label: "Auto subniches" },
      { href: "#features", label: "Features" },
      { href: siteConfig.appPath, label: "Open the tool" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "#compare", label: "vs. spreadsheets" },
      { href: "#guide", label: "Keyword research guide" },
      { href: "#faq", label: "FAQ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-night-950 text-cream-200/70">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm">
            <Wordmark tone="dark" />
            <p className="mt-4 text-[15px] leading-relaxed">
              The Etsy keyword research organizer for eRank CSV exports. {siteConfig.tagline}.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-bold tracking-[0.18em] text-cream-200/45 uppercase">{column.title}</p>
              <ul className="mt-4 space-y-3 text-[15px]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-medium transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-cream-200/45 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Built by {siteConfig.author}.
          </p>
          <p className="max-w-xl sm:text-right">
            Not affiliated with, endorsed by or connected to Etsy or eRank. Etsy and eRank are trademarks of their
            respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
