import { describe, expect, it } from "vitest";

import { EMPTY_WORK_FILTERS, applyWorkFilters } from "./filters";
import {
  OCCASION_BY_ID,
  detectOccasion,
  easterSunday,
  nextWindow,
  nthWeekday,
  phaseOf,
  type OccasionId,
} from "./occasions";
import type { Keyword } from "./types";

const day = (date: Date) => date.toISOString().slice(0, 10);

const occasion = (id: OccasionId) => {
  const found = OCCASION_BY_ID.get(id);
  if (!found) throw new Error(`No occasion ${id}`);
  return found;
};

describe("detectOccasion", () => {
  it.each([
    ["christmas gnome png", "christmas"],
    ["Grinch Shirt", "christmas"],
    ["halloween ghost png", "halloween"],
    ["spooky season sweatshirt", "halloween"],
    ["pumpkin spice shirt", "fall"],
    ["Mother's Day gift", "mothers-day"],
    ["valentines gnome", "valentines"],
    ["4th of July shirt", "july-4th"],
    ["class of 2027 graduation cap", "graduation"],
    ["snowman png", "winter"],
  ])("%s → %s", (keyword, id) => {
    expect(detectOccasion(keyword)?.id).toBe(id);
  });

  it("ignores keywords with no occasion, and words that only contain one", () => {
    expect(detectOccasion("dad joke shirt")).toBeNull();
    expect(detectOccasion("waterfall print")).toBeNull();
  });
});

describe("occasion dates", () => {
  it("works out holidays that move", () => {
    expect(day(easterSunday(2026))).toBe("2026-04-05");
    expect(day(easterSunday(2027))).toBe("2027-03-28");
    expect(day(nthWeekday(2026, 11, 4, 4))).toBe("2026-11-26");
    expect(day(occasion("mothers-day").date(2026))).toBe("2026-05-10");
    expect(day(occasion("fathers-day").date(2026))).toBe("2026-06-21");
  });
});

describe("nextWindow and phaseOf", () => {
  it("puts early September inside Christmas's making window", () => {
    const today = new Date("2026-09-11T12:00:00Z");
    const window = nextWindow(occasion("christmas"), today);

    expect([day(window.makeFrom), day(window.peakFrom), day(window.date)]).toEqual([
      "2026-09-01",
      "2026-10-26",
      "2026-12-25",
    ]);
    expect(phaseOf(window, today)).toBe("make");
  });

  it("says Halloween is selling by late September", () => {
    const today = new Date("2026-09-20T12:00:00Z");

    expect(phaseOf(nextWindow(occasion("halloween"), today), today)).toBe("selling");
  });

  it("rolls over to next year once the day has passed", () => {
    const today = new Date("2026-12-20T12:00:00Z");

    expect(day(nextWindow(occasion("new-year"), today).date)).toBe("2027-01-01");
  });
});

describe("the occasion filter", () => {
  const keyword = (text: string): Keyword => ({
    id: text,
    keyword: text,
    volume: 1,
    competition: 1,
    nicheId: null,
    trend: "Seasonal",
    type: "White hat",
    status: "pending",
    tick: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  });

  it("keeps only keywords for that occasion", () => {
    const list = [keyword("santa png"), keyword("ghost png"), keyword("boho png")];

    const result = applyWorkFilters(list, { ...EMPTY_WORK_FILTERS, occasion: "halloween" }, []);

    expect(result.map((k) => k.keyword)).toEqual(["ghost png"]);
  });
});
