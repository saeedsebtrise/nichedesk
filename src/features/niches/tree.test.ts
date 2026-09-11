import { describe, expect, it } from "vitest";

import { buildTree, canReparent, flattenTree, nichePathLabel, withDescendantIds } from "./tree";
import type { Niche } from "./types";

const niche = (id: string, name: string, parentId: string | null = null): Niche => ({
  id,
  name,
  parentId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const niches: Niche[] = [
  niche("png", "png"),
  niche("xmas", "christmas png", "png"),
  niche("xmas-tree", "christmas tree png", "xmas"),
  niche("halloween", "halloween png", "png"),
  niche("svg", "svg files"),
];

describe("buildTree", () => {
  it("nests children under their parent and sorts each level by name", () => {
    const tree = buildTree(niches);

    expect(tree.map((node) => node.id)).toEqual(["png", "svg"]);
    expect(tree[0].children.map((node) => node.id)).toEqual(["xmas", "halloween"]);
    expect(tree[0].children[0].children[0].id).toBe("xmas-tree");
  });

  it("records depth so the UI can indent", () => {
    const tree = buildTree(niches);

    expect(tree[0].depth).toBe(0);
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children[0].depth).toBe(2);
  });

  it("treats a niche with a missing parent as top-level", () => {
    const tree = buildTree([niche("orphan", "orphan", "deleted-parent")]);

    expect(tree.map((node) => node.id)).toEqual(["orphan"]);
  });

  it("does not hang on a cycle in the data file", () => {
    const cyclic = [niche("a", "a", "b"), niche("b", "b", "a")];

    expect(flattenTree(buildTree(cyclic)).length).toBeLessThanOrEqual(2);
  });
});

describe("flattenTree", () => {
  it("returns niches in depth-first order", () => {
    expect(flattenTree(buildTree(niches)).map((node) => node.id)).toEqual([
      "png",
      "xmas",
      "xmas-tree",
      "halloween",
      "svg",
    ]);
  });
});

describe("withDescendantIds", () => {
  it("includes the niche and every level beneath it", () => {
    expect(withDescendantIds(niches, "png")).toEqual(
      new Set(["png", "xmas", "xmas-tree", "halloween"]),
    );
  });

  it("is just the niche itself for a leaf", () => {
    expect(withDescendantIds(niches, "svg")).toEqual(new Set(["svg"]));
  });
});

describe("nichePathLabel", () => {
  it("joins the chain from the root", () => {
    expect(nichePathLabel(niches, "xmas-tree")).toBe("png › christmas png › christmas tree png");
  });

  it("is empty for an unassigned keyword", () => {
    expect(nichePathLabel(niches, null)).toBe("");
  });
});

describe("canReparent", () => {
  it("allows a move to the top level", () => {
    expect(canReparent(niches, "xmas", null)).toBe(true);
  });

  it("allows a move under an unrelated niche", () => {
    expect(canReparent(niches, "xmas", "svg")).toBe(true);
  });

  it("rejects a niche becoming its own parent", () => {
    expect(canReparent(niches, "png", "png")).toBe(false);
  });

  it("rejects a move under its own descendant", () => {
    expect(canReparent(niches, "png", "xmas-tree")).toBe(false);
  });
});
