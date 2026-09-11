import { describe, expect, it } from "vitest";

import { sortKeywords } from "./filters";
import { opportunityScore, opportunityTier } from "./opportunity";
import type { Keyword } from "./types";

describe("opportunityScore", () => {
  it("is 0 when nobody searches", () => {
    expect(opportunityScore(0, 10)).toBe(0);
    expect(opportunityScore(Number.NaN, 10)).toBe(0);
  });

  it("scores one competing listing per search at 57", () => {
    expect(opportunityScore(100, 99)).toBe(57);
  });

  it("stays within 0–100", () => {
    expect(opportunityScore(1, 1_000_000)).toBe(0);
    expect(opportunityScore(100_000, 0)).toBe(100);
  });

  it("rises with volume and falls with competition", () => {
    expect(opportunityScore(5_000, 2_000)).toBeGreaterThan(opportunityScore(500, 2_000));
    expect(opportunityScore(5_000, 2_000)).toBeGreaterThan(opportunityScore(5_000, 20_000));
  });

  it("treats a missing competition figure as no competition", () => {
    expect(opportunityScore(10, Number.NaN)).toBe(opportunityScore(10, 0));
  });

  it("puts a low-competition keyword well above a saturated one", () => {
    expect(opportunityScore(7_432, 465)).toBeGreaterThanOrEqual(90);
    expect(opportunityScore(48_212, 930_115)).toBeLessThan(25);
  });
});

describe("opportunityTier", () => {
  it("buckets scores at 70, 45 and 25", () => {
    expect(opportunityTier(70)).toBe("hot");
    expect(opportunityTier(69)).toBe("good");
    expect(opportunityTier(45)).toBe("good");
    expect(opportunityTier(44)).toBe("fair");
    expect(opportunityTier(25)).toBe("fair");
    expect(opportunityTier(24)).toBe("tough");
  });
});

describe("sortKeywords by score", () => {
  const keyword = (id: string, volume: number, competition: number): Keyword => ({
    id,
    keyword: id,
    volume,
    competition,
    nicheId: null,
    trend: "Evergreen",
    type: "White hat",
    status: "pending",
    tick: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  });

  it("orders by opportunity, best first when descending", () => {
    const list = [keyword("saturated", 48_212, 930_115), keyword("gem", 7_432, 465), keyword("middling", 3_310, 4_120)];
    expect(sortKeywords(list, "score", "desc").map((item) => item.id)).toEqual(["gem", "middling", "saturated"]);
    expect(sortKeywords(list, "score", "asc").map((item) => item.id)).toEqual(["saturated", "middling", "gem"]);
  });
});
