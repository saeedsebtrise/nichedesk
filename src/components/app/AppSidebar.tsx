"use client";

import { useMemo, useState, type ReactElement, type ReactNode, type SVGProps } from "react";

import { PaletteShortcut } from "@/components/app/CommandPalette";
import { ChevronRight, ICONS, LayoutGrid } from "@/components/marketing/icons";
import { Wordmark } from "@/components/shared/Wordmark";
import { withDescendantIds } from "@/features/niches/tree";
import type { NicheNode } from "@/features/niches/types";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

export type AppTab = "overview" | "sort" | "work";

const SearchIcon = ICONS.search;

const NAV: { id: AppTab; label: string; icon: (props: SVGProps<SVGSVGElement>) => ReactElement }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "sort", label: "Sort Keyword", icon: ICONS.upload },
  { id: "work", label: "Upcoming Work", icon: ICONS.list },
];

type Tally = { total: number; done: number };

/**
 * The tool's left rail: navigation, search, and the niche tree itself — with a
 * keyword count and a done-progress bar on every niche. Clicking a niche opens
 * Upcoming Work filtered to it (subniches included).
 */
export function AppSidebar({
  workspace,
  tab,
  onTab,
  activeNiche,
  onNiche,
  onManageNiches,
  onOpenPalette,
  footer,
}: {
  workspace: Workspace;
  tab: AppTab;
  onTab: (tab: AppTab) => void;
  /** The niche Upcoming Work is filtered to, highlighted while that view is open. */
  activeNiche: string | "all" | "none" | null;
  onNiche: (id: string | "all" | "none") => void;
  onManageNiches: () => void;
  onOpenPalette: () => void;
  footer?: ReactNode;
}) {
  const { keywords, niches, tree } = workspace;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tallies = useMemo(() => {
    const own = new Map<string, Tally>();
    let unassigned = 0;
    for (const keyword of keywords) {
      if (!keyword.nicheId) {
        unassigned += 1;
        continue;
      }
      const tally = own.get(keyword.nicheId) ?? { total: 0, done: 0 };
      tally.total += 1;
      if (keyword.status === "done") tally.done += 1;
      own.set(keyword.nicheId, tally);
    }

    const rolled = new Map<string, Tally>();
    for (const niche of niches) {
      const sum: Tally = { total: 0, done: 0 };
      for (const id of withDescendantIds(niches, niche.id)) {
        const tally = own.get(id);
        if (tally) {
          sum.total += tally.total;
          sum.done += tally.done;
        }
      }
      rolled.set(niche.id, sum);
    }
    return { rolled, unassigned };
  }, [keywords, niches]);

  const pending = keywords.filter((keyword) => keyword.status === "pending").length;

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rowClass = (active: boolean) =>
    cn(
      "group flex items-center gap-1 rounded-lg pr-2 transition-colors",
      active ? "bg-brand-500/15 text-white ring-1 ring-brand-500/25" : "text-cream-200/70 hover:bg-white/[0.04] hover:text-white",
    );

  const renderNodes = (nodes: NicheNode[]): ReactNode =>
    nodes.map((node) => {
      const tally = tallies.rolled.get(node.id) ?? { total: 0, done: 0 };
      const open = !collapsed.has(node.id);
      const share = tally.total > 0 ? Math.round((tally.done / tally.total) * 100) : 0;

      return (
        <li key={node.id}>
          <div className={rowClass(activeNiche === node.id)} style={{ paddingLeft: 4 + node.depth * 14 }}>
            {node.children.length > 0 ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
                aria-expanded={open}
                className="grid size-6 shrink-0 place-items-center rounded text-cream-200/40 hover:text-white"
              >
                <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
              </button>
            ) : (
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-cream-200/25">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onNiche(node.id)}
              title={`${formatNumber(tally.done)} of ${formatNumber(tally.total)} done`}
              className="flex min-w-0 flex-1 flex-col py-1.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="truncate">{node.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-cream-200/40 tabular-nums">{formatNumber(tally.total)}</span>
              </span>
              {tally.total > 0 ? (
                <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-300"
                    style={{ width: `${share}%` }}
                  />
                </span>
              ) : null}
            </button>
          </div>
          {node.children.length > 0 && open ? <ul className="mt-0.5 space-y-0.5">{renderNodes(node.children)}</ul> : null}
        </li>
      );
    });

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Wordmark tone="dark" />
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream-200/45 transition-colors hover:border-white/15 hover:text-cream-100"
        >
          <SearchIcon className="size-4" />
          Search…
          <span className="ml-auto">
            <PaletteShortcut />
          </span>
        </button>
      </div>

      <nav aria-label="Workspace" className="mt-5 space-y-0.5 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onTab(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-cream-200/65 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon className={cn("size-4", active && "text-brand-300")} />
              {item.label}
              {item.id === "work" && pending > 0 ? (
                <span className="ml-auto rounded-md bg-white/[0.08] px-1.5 text-[11px] text-cream-200/70 tabular-nums">
                  {formatNumber(pending)}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-7 flex items-center justify-between px-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-cream-200/40 uppercase">Niche tree</p>
        <button
          type="button"
          onClick={onManageNiches}
          className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-brand-300 transition-colors hover:bg-brand-500/10"
        >
          Manage
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          <li>
            <button type="button" onClick={() => onNiche("all")} className={cn(rowClass(activeNiche === "all"), "w-full py-1.5 pl-1")}>
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-cream-200/40">
                ◆
              </span>
              <span className="text-sm">All keywords</span>
              <span className="ml-auto text-[11px] text-cream-200/40 tabular-nums">{formatNumber(keywords.length)}</span>
            </button>
          </li>
          {tallies.unassigned > 0 ? (
            <li>
              <button type="button" onClick={() => onNiche("none")} className={cn(rowClass(activeNiche === "none"), "w-full py-1.5 pl-1")}>
                <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-cream-200/30">
                  ○
                </span>
                <span className="text-sm">No niche</span>
                <span className="ml-auto text-[11px] text-cream-200/40 tabular-nums">{formatNumber(tallies.unassigned)}</span>
              </button>
            </li>
          ) : null}
          {renderNodes(tree)}
        </ul>

        {tree.length === 0 ? (
          <button
            type="button"
            onClick={onManageNiches}
            className="mt-2 w-full rounded-xl border border-dashed border-white/15 px-3 py-4 text-xs text-cream-200/50 transition-colors hover:border-brand-500/40 hover:text-white"
          >
            + Create your first niche
          </button>
        ) : null}
      </div>

      {footer ? <div className="border-t border-white/[0.07] p-4">{footer}</div> : null}
    </div>
  );
}
