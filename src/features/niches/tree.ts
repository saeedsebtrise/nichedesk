import type { Niche, NicheNode } from "./types";

const byName = (a: Niche, b: Niche) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/**
 * Builds the niche forest from a flat list.
 *
 * A niche whose `parentId` points at a missing niche is treated as top-level so
 * a broken reference can never hide keywords from the UI. Cycles (which the API
 * rejects on write, but which a hand-edited data file could still contain) are
 * broken by only ever visiting a niche once.
 */
export function buildTree(niches: Niche[]): NicheNode[] {
  const known = new Set(niches.map((n) => n.id));
  const childrenOf = new Map<string | null, Niche[]>();

  for (const niche of niches) {
    const parentId = niche.parentId && known.has(niche.parentId) ? niche.parentId : null;
    const siblings = childrenOf.get(parentId) ?? [];
    siblings.push(niche);
    childrenOf.set(parentId, siblings);
  }

  const visited = new Set<string>();

  const attach = (niche: Niche, depth: number): NicheNode => {
    visited.add(niche.id);
    const children = (childrenOf.get(niche.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .sort(byName)
      .map((child) => attach(child, depth + 1));
    return { ...niche, children, depth };
  };

  return (childrenOf.get(null) ?? []).sort(byName).map((root) => attach(root, 0));
}

/** Depth-first flattening, so the UI can render an indented list from one map(). */
export function flattenTree(nodes: NicheNode[]): NicheNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

/** The niche plus every niche nested underneath it, at any depth. */
export function withDescendantIds(niches: Niche[], nicheId: string): Set<string> {
  const ids = new Set<string>([nicheId]);
  let grew = true;

  while (grew) {
    grew = false;
    for (const niche of niches) {
      if (niche.parentId && ids.has(niche.parentId) && !ids.has(niche.id)) {
        ids.add(niche.id);
        grew = true;
      }
    }
  }

  return ids;
}

/** Root-first chain of niches down to `nicheId`, for `parent › child` labels. */
export function nichePath(niches: Niche[], nicheId: string | null): Niche[] {
  if (!nicheId) return [];
  const byId = new Map(niches.map((n) => [n.id, n]));
  const path: Niche[] = [];
  const seen = new Set<string>();

  let current = byId.get(nicheId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

export function nichePathLabel(niches: Niche[], nicheId: string | null, separator = " › "): string {
  return nichePath(niches, nicheId)
    .map((n) => n.name)
    .join(separator);
}

/**
 * Whether `parentId` is a legal parent for `nicheId` — a niche cannot be moved
 * under itself or under one of its own descendants, which would orphan a whole
 * subtree from the roots.
 */
export function canReparent(niches: Niche[], nicheId: string, parentId: string | null): boolean {
  if (!parentId) return true;
  if (parentId === nicheId) return false;
  return !withDescendantIds(niches, nicheId).has(parentId);
}
