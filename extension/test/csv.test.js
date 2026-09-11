import { describe, expect, it } from "vitest";

import { parseErankCsv, parseNumber } from "../src/lib/csv.js";

describe("parseNumber", () => {
  it("reads eRank's formats", () => {
    expect(parseNumber("10,971,543")).toBe(10971543);
    expect(parseNumber("1.2K")).toBe(1200);
    expect(parseNumber("136%")).toBe(136);
    expect(parseNumber("")).toBe(0);
    expect(parseNumber("—")).toBe(0);
  });
});

describe("parseErankCsv", () => {
  it("finds the header below a title line and reads every known column", () => {
    const text = [
      "eRank - Keyword Tool - pet blanket",
      "",
      "Keywords,Search Trend,Avg. Searches,Avg. Clicks,Avg. CTR,Etsy Competition,KD",
      'pet blanket,Jul 26,"1,512","1,213",80%,"44,649",74',
    ].join("\n");

    const { rows, error } = parseErankCsv(text);

    expect(error).toBeNull();
    expect(rows).toEqual([
      { keyword: "pet blanket", searches: 1512, competition: 44649, clicks: 1213, ctr: 80 },
    ]);
  });

  it("explains a file with no keyword column", () => {
    expect(parseErankCsv("a,b\n1,2").error).toMatch(/Keywords/);
  });

  it("explains a file with no numbers to judge", () => {
    expect(parseErankCsv("Keywords,Notes\npet,hi").error).toMatch(/searches or competition/);
  });
});
