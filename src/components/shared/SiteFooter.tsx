import Link from "next/link";

import { Wordmark } from "@/components/shared/Wordmark";
import { siteConfig } from "@/config/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#niche-tree", label: "Niche tree" },
      { href: "#compare", label: "vs. spreadsheets" },
      { href: siteConfig.appPath, label: "Open the tool" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#guide", label: "Keyword research guide" },
      { href: "#faq", label: "FAQ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-900/[0.06] bg-cream-100/70">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-[15px] leading-relaxed text-ink-700">
              The Etsy keyword research organizer for eRank CSV exports — {siteConfig.tagline.toLowerCase()}.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-bold tracking-[0.18em] text-ink-500 uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3 text-[15px]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-medium text-ink-700 transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink-900/[0.08] pt-8 text-xs text-ink-500 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Built by {siteConfig.author}.
          </p>
          <p className="max-w-xl sm:text-right">
            Not affiliated with, endorsed by or connected to Etsy or eRank. Etsy and eRank are
            trademarks of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
