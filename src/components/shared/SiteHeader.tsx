"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ArrowRight } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { Wordmark } from "@/components/shared/Wordmark";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#niche-tree", label: "Auto subniches" },
  { href: "#features", label: "Features" },
  { href: "#guide", label: "Guide" },
  { href: "#faq", label: "FAQ" },
];

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

/** A floating bar: clear over the hero, frosted glass once the page scrolls. */
export function SiteHeader() {
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 24,
    () => false,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-3 rounded-2xl border py-2 pr-2 pl-3 transition-[background-color,border-color,box-shadow] duration-500 sm:pl-4",
          solid
            ? "border-white/10 bg-night-950/75 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent",
        )}
      >
        <Wordmark tone="dark" />

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-cream-200/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={siteConfig.appPath}
          className="group ml-auto hidden items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-night-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-px sm:inline-flex lg:ml-2"
        >
          Open the tool
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
          className="ml-auto grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/[0.08] sm:ml-0 lg:hidden"
        >
          <span aria-hidden="true" className="relative block h-3 w-4">
            <span
              className={cn(
                "absolute top-0 left-0 h-0.5 w-4 rounded bg-current transition-transform duration-300",
                open && "translate-y-[5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-0.5 w-4 rounded bg-current transition-transform duration-300",
                open && "-translate-y-[5px] -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-menu"
            aria-label="Sections"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-night-950/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold text-cream-100 transition-colors hover:bg-white/[0.06]"
                  >
                    {item.label}
                    <ArrowRight className="size-4 text-cream-200/40" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={siteConfig.appPath}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 font-bold text-white"
            >
              Open the tool
              <ArrowRight className="size-4" />
            </Link>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
