import { describe, expect, it } from "vitest";

import { parseCsv, parseErankCsv, parseNumber, toCsv } from "./csv";

describe("parseCsv", () => {
  it("reads quoted fields containing commas", () => {
    expect(parseCsv('a,"b,c",d')).toEqual([["a", "b,c", "d"]]);
  });

  it("reads escaped quotes", () => {
    expect(parseCsv('"say ""hi""",2')).toEqual([['say "hi"', "2"]]);
  });

  it("handles CRLF rows and skips blank lines", () => {
    expect(parseCsv("a,b\r\n\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("strips a UTF-8 BOM from the first header", () => {
    expect(parseCsv("﻿Keywords,Competition")[0][0]).toBe("Keywords");
  });
});

describe("parseNumber", () => {
  it("reads thousands separators", () => {
    expect(parseNumber("10,971,543")).toBe(10971543);
  });

  it("reads K and M suffixes", () => {
    expect(parseNumber("1.2K")).toBe(1200);
    expect(parseNumber("2M")).toBe(2000000);
  });

  it("falls back to 0 for blanks and dashes", () => {
    expect(parseNumber("")).toBe(0);
    expect(parseNumber("-")).toBe(0);
    expect(parseNumber("n/a")).toBe(0);
  });
});

describe("parseErankCsv", () => {
  const erank = [
    "eRank - Keyword Tool - png",
    "",
    "Keywords,Search Trend,Avg. Searches,Avg. Clicks,CTR,Competition,KD",
    'png,"Jun 26",99955,272090,136%,"10,971,543",87',
    'christmas png,"Jun 26","48,212","66,294",138%,"930,115",64',
  ].join("\n");

  it("finds the header below a title row and maps eRank columns", () => {
    const { rows } = parseErankCsv(erank);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ keyword: "png", volume: 99955, competition: 10971543 });
    expect(rows[1]).toMatchObject({ keyword: "christmas png", volume: 48212, competition: 930115 });
  });

  it("drops duplicate keywords and says so", () => {
    const { rows, warnings } = parseErankCsv(
      "Keywords,Avg. Searches,Competition\npng,10,20\nPNG,10,20\n",
    );

    expect(rows).toHaveLength(1);
    expect(warnings.join(" ")).toContain("1 duplicate");
  });

  it("falls back to positional columns when no header is recognisable", () => {
    const { rows, warnings } = parseErankCsv("fall shirt,120,4500\nharvest tee,80,900\n");

    expect(rows[0]).toMatchObject({ keyword: "fall shirt", volume: 120, competition: 4500 });
    expect(warnings.join(" ")).toContain("No eRank header row");
  });

  it("zero-fills a missing volume column and warns", () => {
    const { rows, warnings } = parseErankCsv("Keywords,Competition\npng,930115\n");

    expect(rows[0]).toMatchObject({ keyword: "png", volume: 0, competition: 930115 });
    expect(warnings.join(" ")).toContain("search-volume");
  });

  it("reports an empty file", () => {
    expect(parseErankCsv("").warnings.join(" ")).toContain("empty");
  });
});

describe("toCsv", () => {
  it("quotes fields containing commas, quotes or newlines", () => {
    expect(toCsv([["a,b", 'c"d', "e"]])).toBe('"a,b","c""d",e');
  });
});
