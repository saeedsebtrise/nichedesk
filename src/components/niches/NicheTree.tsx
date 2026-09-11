"use client";

import { useMemo } from "react";

import { flattenTree, nichePathLabel } from "@/features/niches/tree";
import type { Niche, NicheNode } from "@/features/niches/types";
import { Select } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const INDENT = "   ";

/** Indented option label, so a native select still reads as a tree. */
function optionLabel(node: NicheNode): string {
  return node.depth === 0 ? node.name : INDENT.repeat(node.depth) + "└ " + node.name;
}

/**
 * Niche picker as a native select with indented options.
 *
 * Used wherever a niche is one field among many (filters, parent pickers, the
 * manual-keyword form). Native beats a custom popover here: keyboard support,
 * type-ahead and mobile behaviour come for free.
 */
export function NicheTreeSelect({
  tree,
  value,
  onChange,
  allLabel,
  noneLabel,
  disabledIds,
  className,
  id,
}: {
  tree: NicheNode[];
  value: string | "all" | "none";
  onChange: (value: string | "all" | "none") => void;
  /** Shown as the first option when the picker can mean "no filter". */
  allLabel?: string;
  /** Shown as the "not in any niche" option. */
  noneLabel?: string;
  /** Niches that cannot be chosen — a niche may not become its own parent. */
  disabledIds?: Set<string>;
  className?: string;
  id?: string;
}) {
  const nodes = useMemo(() => flattenTree(tree), [tree]);

  return (
    <Select
      id={id}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value as string | "all" | "none")}
    >
      {allLabel ? <option value="all">{allLabel}</option> : null}
      {noneLabel ? <option value="none">{noneLabel}</option> : null}
      {nodes.map((node) => (
        <option key={node.id} value={node.id} disabled={disabledIds?.has(node.id)}>
          {optionLabel(node)}
        </option>
      ))}
    </Select>
  );
}

/**
 * The indented, clickable niche tree used inside the "Add to a niche" and
 * "Move to niche" dialogs.
 *
 * While searching, matches are shown with their full `parent › child` path so a
 * subniche name that appears under several parents is still unambiguous.
 */
export function NicheTreeList({
  tree,
  niches,
  search,
  selectedId,
  onSelect,
  emptyMessage = "No niches yet — create one below.",
}: {
  tree: NicheNode[];
  niches: Niche[];
  search: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
}) {
  const query = search.trim().toLowerCase();
  const nodes = useMemo(() => flattenTree(tree), [tree]);

  const visible = useMemo(() => {
    if (query === "") return nodes;
    return nodes.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        nichePathLabel(niches, node.id).toLowerCase().includes(query),
    );
  }, [nodes, niches, query]);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-cream-300 px-3 py-6 text-center text-sm text-ink-500">
        {query === "" ? emptyMessage : `No niche matches “${search.trim()}”.`}
      </p>
    );
  }

  return (
    <ul className="max-h-56 overflow-y-auto rounded-xl border border-cream-200 bg-white">
      {visible.map((node) => {
        const selected = node.id === selectedId;
        const searching = query !== "";

        return (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onSelect(node.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "bg-brand-100 font-semibold text-brand-700"
                  : "text-ink-700 hover:bg-cream-100",
              )}
              style={{ paddingLeft: searching ? undefined : 12 + node.depth * 18 }}
            >
              {!searching && node.depth > 0 ? (
                <span aria-hidden="true" className="text-ink-500">
                  └
                </span>
              ) : null}
              <span className="truncate">
                {searching ? nichePathLabel(niches, node.id) : node.name}
              </span>
              {node.children.length > 0 ? (
                <span className="ml-auto shrink-0 rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                  {node.children.length} sub
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The `parent › child` pill shown next to a keyword. */
export function NicheTag({ niches, nicheId }: { niches: Niche[]; nicheId: string | null }) {
  if (!nicheId) {
    return <span className="text-[11px] font-medium text-ink-500">no niche</span>;
  }

  const path = nichePathLabel(niches, nicheId);
  if (path === "") return null;

  return (
    <span
      title={path}
      className="max-w-52 truncate rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600"
    >
      {path}
    </span>
  );
}
