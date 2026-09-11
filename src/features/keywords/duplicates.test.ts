import { describe, expect, it } from "vitest";

import { duplicateSignature, findDuplicates } from "./duplicates";
import type { Keyword } from "./types";

const keyword = (id: string, text: string, volume = 100, competition = 50): Keyword => ({
  id,
  keyword: text,
  volume,
  competition,
  nicheId: null,
  trend: "Evergreen",
  type: "White hat",
  status: "pending",
  tick: false,
  createdAt: "2026-09-01T00:00:00.000Z",
});

describe("duplicateSignature", () => {
  it("ignores word order, plurals, case and punctuation", () => {
    const signature = duplicateSignature("christmas png");

    expect(duplicateSignature("png christmas")).toBe(signature);
    expect(duplicateSignature("Christmas PNGs")).toBe(signature);
    expect(duplicateSignature("christmas-png")).toBe(signature);
  });

  it("ignores small joining words", () => {
    expect(duplicateSignature("gift for mom")).toBe(duplicateSignature("mom gift"));
  });

  it("keeps different searches apart", () => {
    expect(duplicateSignature("christmas png")).not.toBe(duplicateSignature("christmas svg"));
  });
});

describe("findDuplicates", () => {
  it("groups the same search written differently, best copy first", () => {
    const groups = findDuplicates([
      keyword("a", "png christmas", 90),
      keyword("b", "christmas png", 500),
      keyword("c", "ghost png"),
      keyword("d", "Christmas PNGs", 40),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].keywords.map((k) => k.id)).toEqual(["b", "a", "d"]);
  });

  it("finds nothing when every keyword is different", () => {
    expect(findDuplicates([keyword("a", "ghost png"), keyword("b", "santa png")])).toEqual([]);
  });
});
