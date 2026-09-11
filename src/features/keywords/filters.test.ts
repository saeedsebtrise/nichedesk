import { describe, expect, it } from "vitest";

import type { Niche } from "../niches/types";
import { EMPTY_IMPORT_FILTERS, EMPTY_WORK_FILTERS, applyImportFilters, applyWorkFilters, sortKeywords } from "./filters";
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
