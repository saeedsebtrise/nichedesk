import Link from "next/link";

import { ArrowRight } from "@/components/marketing/icons";
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
    <footer className="relative overflow-hidden">
      <div aria-hidden="true" className="hairline absolute inset-x-0 top-0 h-px" />

      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Wordmark tone="dark" />
            <p className="mt-5 text-[0.95rem] leading-relaxed text-cream-200/55">
              The Etsy keyword research organizer for eRank CSV exports. {siteConfig.tagline}.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold tracking-[0.16em] text-cream-200/40 uppercase">{column.title}</p>
              <ul className="mt-5 space-y-3 text-[0.95rem]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-cream-200/70 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-cream-200/40 uppercase">Get started</p>
            <p className="mt-5 text-[0.95rem] text-cream-200/60">Free to use. No signup.</p>
            <Link
              href={siteConfig.appPath}
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-night-950 transition-transform hover:-translate-y-px"
            >
              Open NicheDesk
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-xs text-cream-200/40 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Built by {siteConfig.author}.
          </p>
          <p className="max-w-xl sm:text-right">
            Not affiliated with, endorsed by or connected to Etsy or eRank. Etsy and eRank are trademarks of their
            respective owners.
          </p>
        </div>
      </div>

      {/* The oversized wordmark the page signs off with. */}
      <p
        aria-hidden="true"
        className="font-display pointer-events-none mt-8 translate-y-[20%] bg-gradient-to-b from-white/[0.13] to-white/0 bg-clip-text text-center text-[clamp(4.5rem,19vw,22rem)] leading-[0.8] font-extrabold tracking-[-0.06em] text-transparent select-none"
      >
        {siteConfig.name}
      </p>
    </footer>
  );
}
