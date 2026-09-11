"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { ICONS } from "@/components/marketing/icons";
import { Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const SearchIcon = ICONS.search;

export type PaletteItem = {
  id: string;
  group: string;
  label: string;
  detail?: string;
  icon?: ReactNode;
  /** Extra words the item should match, beyond its label and detail. */
  keywords?: string;
  run: () => void;
};

const noSubscription = () => () => undefined;

/** "⌘ K" on a Mac, "Ctrl K" elsewhere — resolved after hydration. */
export function PaletteShortcut() {
  const mac = useSyncExternalStore(
    noSubscription,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
  return <Kbd>{mac ? "⌘ K" : "Ctrl K"}</Kbd>;
}

function PaletteBody({
  items,
  searchMore,
  onClose,
}: {
  items: PaletteItem[];
  /** Results that only make sense for a typed query, such as matching keywords. */
  searchMore: (query: string) => PaletteItem[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  // Flat, in the order the groups are drawn, so arrow keys follow what is on screen.
  const ordered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let results: PaletteItem[];
    if (q === "") {
      results = [
        ...items.filter((item) => item.group !== "Niches"),
        ...items.filter((item) => item.group === "Niches").slice(0, 6),
      ];
    } else {
      const terms = q.split(/\s+/);
      const matches = (item: PaletteItem) => {
        const text = `${item.label} ${item.detail ?? ""} ${item.keywords ?? ""}`.toLowerCase();
        return terms.every((term) => text.includes(term));
      };
      results = [...items.filter(matches), ...searchMore(q)].slice(0, 40);
    }
    const groups = [...new Set(results.map((item) => item.group))];
    return groups.flatMap((group) => results.filter((item) => item.group === group));
  }, [items, searchMore, query]);

  const current = Math.min(active, Math.max(ordered.length - 1, 0));
  const groups = [...new Set(ordered.map((item) => item.group))];

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
        <SearchIcon className="size-5 shrink-0 text-cream-200/40" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive(Math.min(current + 1, ordered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive(Math.max(current - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              choose(ordered[current]);
            }
          }}
          placeholder="Search keywords, niches and actions…"
          aria-label="Search keywords, niches and actions"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={ordered[current] ? `palette-${ordered[current].id}` : undefined}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-cream-200/35 focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div ref={list} id="palette-results" role="listbox" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        {ordered.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-cream-200/50">Nothing matches “{query}”.</p>
        ) : (
          groups.map((group) => (
            <div key={group} role="group" aria-label={group}>
              <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-cream-200/40 uppercase">
                {group}
              </p>
              {ordered
                .filter((item) => item.group === group)
                .map((item) => {
                  const index = ordered.indexOf(item);
                  const isActive = index === current;
                  return (
                    <button
                      key={item.id}
                      id={`palette-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseMove={() => setActive(index)}
                      onClick={() => choose(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        isActive ? "bg-white/[0.08] text-white" : "text-cream-200/75",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-cream-200/70 ring-1 ring-white/10">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.detail ? <span className="block truncate text-xs text-cream-200/45">{item.detail}</span> : null}
                      </span>
                      {isActive ? <span className="text-xs text-cream-200/40">↵</span> : null}
                    </button>
                  );
                })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-white/[0.08] px-4 py-2.5 text-[11px] text-cream-200/40">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
        </span>
        <span>
          <Kbd>↵</Kbd> to open
        </span>
        <span className="ml-auto">NicheDesk</span>
      </div>
    </>
  );
}

/** Ctrl/⌘ K: jump anywhere, run any action, find any keyword. */
export function CommandPalette({
  open,
  onClose,
  items,
  searchMore,
}: {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
  searchMore: (query: string) => PaletteItem[];
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Command palette"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="mx-auto mt-[12vh] mb-auto w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-night-900/95 p-0 text-cream-100 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open ? <PaletteBody items={items} searchMore={searchMore} onClose={onClose} /> : null}
    </dialog>
  );
}
