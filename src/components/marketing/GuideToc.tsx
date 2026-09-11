"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** The guide's table of contents, highlighting the section being read. */
export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A band across the upper middle of the screen decides "being read".
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const { id } of items) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="In this guide" className="mt-10 hidden lg:block">
      <ol className="space-y-1 border-l border-white/10">
        {items.map((item, index) => {
          const current = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "-ml-px flex gap-3 border-l-2 py-2 pl-4 text-sm leading-snug transition-colors",
                  current ? "border-brand-500 text-white" : "border-transparent text-cream-200/45 hover:text-cream-100",
                )}
              >
                <span className="font-mono text-xs opacity-60">{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
