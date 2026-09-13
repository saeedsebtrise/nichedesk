import { describe, expect, it } from "vitest";

import type { Niche } from "../niches/types";
import {
  EMPTY_IMPORT_FILTERS,
  EMPTY_WORK_FILTERS,
  applyImportFilters,
  applyWorkFilters,
  sortKeywords,
  sortRows,
  toggleSortRule,
} from "./filters";
import type { ImportRow, Keyword } from "./types";

const row = (keyword: string, volume: number, competition: number): ImportRow => ({
  id: keyword,
  keyword,
  volume,
  competition,
});

const rows = [
  row("christmas png", 48212, 930115),
  row("halloween png", 45532, 545600),
  row("fall shirt", 120, 4500),
  row("cozy coffee svg", 800, 2200),
];

describe("applyImportFilters", () => {
  it("keeps everything when no filter is set", () => {
    expect(applyImportFilters(rows, EMPTY_IMPORT_FILTERS)).toHaveLength(4);
  });

  it("keeps rows containing any including term", () => {
    const result = applyImportFilters(rows, { ...EMPTY_IMPORT_FILTERS, including: "png, svg" });

    expect(result.map((r) => r.keyword)).toEqual(["christmas png", "halloween png", "cozy coffee svg"]);
  });

  it("drops rows containing an excluding term", () => {
    const result = applyImportFilters(rows, { ...EMPTY_IMPORT_FILTERS, excluding: "halloween" });

    expect(result.map((r) => r.keyword)).not.toContain("halloween png");
  });

  it("applies volume and competition bounds together", () => {
    const result = applyImportFilters(rows, {
      ...EMPTY_IMPORT_FILTERS,
      minVolume: "500",
      maxCompetition: "600000",
    });

    expect(result.map((r) => r.keyword)).toEqual(["halloween png", "cozy coffee svg"]);
  });

  it("ignores a filter box that is not a number", () => {
    expect(applyImportFilters(rows, { ...EMPTY_IMPORT_FILTERS, minVolume: "abc" })).toHaveLength(4);
  });
});

const niches: Niche[] = [
  { id: "png", name: "png", parentId: null, createdAt: "" },
  { id: "xmas", name: "christmas png", parentId: "png", createdAt: "" },
  { id: "svg", name: "svg files", parentId: null, createdAt: "" },
];

const keyword = (id: string, nicheId: string | null, overrides: Partial<Keyword> = {}): Keyword => ({
  id,
  keyword: id,
  volume: 1000,
  competition: 1000,
  nicheId,
  trend: "Evergreen",
  type: "White hat",
  status: "pending",
  tick: false,
  createdAt: "",
  ...overrides,
});

const keywords = [
  keyword("in-parent", "png"),
  keyword("in-child", "xmas"),
  keyword("in-other", "svg"),
  keyword("unassigned", null),
];

describe("applyWorkFilters", () => {
  it("includes subniche keywords when filtering by the parent", () => {
    const result = applyWorkFilters(keywords, { ...EMPTY_WORK_FILTERS, nicheId: "png" }, niches);

    expect(result.map((k) => k.id)).toEqual(["in-parent", "in-child"]);
  });

  it("shows only that niche when filtering by a leaf", () => {
    const result = applyWorkFilters(keywords, { ...EMPTY_WORK_FILTERS, nicheId: "xmas" }, niches);

    expect(result.map((k) => k.id)).toEqual(["in-child"]);
  });

  it("can isolate keywords with no niche", () => {
    const result = applyWorkFilters(keywords, { ...EMPTY_WORK_FILTERS, nicheId: "none" }, niches);

    expect(result.map((k) => k.id)).toEqual(["unassigned"]);
  });

  it("matches ticked keywords regardless of pending or done", () => {
    const mixed = [
      keyword("ticked-pending", "png", { tick: true }),
      keyword("ticked-done", "png", { tick: true, status: "done" }),
      keyword("plain", "png"),
    ];

    const result = applyWorkFilters(mixed, { ...EMPTY_WORK_FILTERS, status: "ticked" }, niches);

    expect(result.map((k) => k.id)).toEqual(["ticked-pending", "ticked-done"]);
  });

  it("combines search, status and trend", () => {
    const mixed = [
      keyword("a", "png", { status: "done", trend: "Trending" }),
      keyword("ab", "png", { status: "done", trend: "Evergreen" }),
      keyword("b", "png", { status: "pending", trend: "Trending" }),
    ];

    const result = applyWorkFilters(
      mixed,
      { ...EMPTY_WORK_FILTERS, search: "a", status: "done", trend: "Trending" },
      niches,
    );

    expect(result.map((k) => k.id)).toEqual(["a"]);
  });
});

describe("sortKeywords", () => {
  it("sorts by volume descending without mutating the input", () => {
    const input = [keyword("low", null, { volume: 10 }), keyword("high", null, { volume: 90 })];
    const sorted = sortKeywords(input, "volume", "desc");

    expect(sorted.map((k) => k.id)).toEqual(["high", "low"]);
    expect(input.map((k) => k.id)).toEqual(["low", "high"]);
  });
});

describe("sortRows with several levels", () => {
  const bands = {
    competitionRules: { green: 5000, lightGreen: 10000, orange: 20000 },
    volumeRules: { low: 200, high: 1000 },
  };
  const list = [
    row("a", 150, 25000),
    row("b", 5000, 30000),
    row("c", 800, 2000),
    row("d", 90, 1000),
    row("e", 3000, 4000),
  ];

  it("sorts by the one column when there is one level", () => {
    const sorted = sortRows(list, [{ key: "competition", direction: "desc" }], bands);

    expect(sorted.map((r) => r.id)).toEqual(["b", "a", "e", "c", "d"]);
  });

  it("groups by competition colour, then orders each group by volume", () => {
    const sorted = sortRows(
      list,
      [
        { key: "competition", direction: "desc" },
        { key: "volume", direction: "asc" },
      ],
      bands,
    );

    // Red (a, b) first with the lower volume on top, then green (c, d, e) by volume.
    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "d", "c", "e"]);
  });

  it("keeps the original order with no sort", () => {
    expect(sortRows(list, [], bands).map((r) => r.id)).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("toggleSortRule", () => {
  it("sorts by a new column alone, and flips the leading one", () => {
    const byVolume = toggleSortRule([], "volume");
    expect(byVolume).toEqual([{ key: "volume", direction: "desc" }]);
    expect(toggleSortRule(byVolume, "volume")).toEqual([{ key: "volume", direction: "asc" }]);
    expect(toggleSortRule(byVolume, "keyword")).toEqual([{ key: "keyword", direction: "asc" }]);
  });

  it("adds a level with add, and flips a level already there", () => {
    const two = toggleSortRule([{ key: "competition", direction: "desc" }], "volume", true);
    expect(two).toEqual([
      { key: "competition", direction: "desc" },
      { key: "volume", direction: "desc" },
    ]);
    expect(toggleSortRule(two, "volume", true)[1]).toEqual({ key: "volume", direction: "asc" });
  });
});
