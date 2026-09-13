import { describe, expect, it } from "vitest";

import { parseUsptoResponse, trademarkTerms, trademarkVerdict, usptoQuery, type TrademarkMark } from "./trademarks";

describe("trademarkTerms", () => {
  it.each([
    ["snoopy png", ["snoopy"]],
    ["Stranger Things Christmas PNG", ["stranger things"]],
    ["later gator png", ["later gator"]],
    ["mickey mouse christmas t-shirt", ["mickey mouse", "mickey"]],
    ["taylor swift eras tour png", ["taylor swift eras tour", "taylor swift eras", "swift eras tour", "taylor swift", "swift eras", "eras tour"]],
  ])("%s → %j", (keyword, terms) => {
    expect(trademarkTerms(keyword)).toEqual(terms);
  });

  it("checks nothing in a keyword made of everyday and product words", () => {
    expect(trademarkTerms("funny cat tee")).toEqual([]);
    expect(trademarkTerms("boy mom svg")).toEqual([]);
    expect(trademarkTerms("class of 2027 png")).toEqual([]);
  });

  it("skips everyday words and holiday phrases that every shop uses", () => {
    expect(trademarkTerms("pumpkin spice shirt")).toEqual([]);
    expect(trademarkTerms("valentine goose png")).toEqual([]);
    expect(trademarkTerms("cozy season shirt")).toEqual([]);
  });

  it("never starts or ends a phrase on a small joining word", () => {
    expect(trademarkTerms("lord of the rings png")).toContain("lord of the rings");
    expect(trademarkTerms("lord of the rings png")).not.toContain("of the rings");
  });
});

const hit = (id: string, wordmark: string, extra: Record<string, unknown> = {}) => ({
  _id: id,
  _source: { wordmark, alive: true, registered: true, statusDescription: "REGISTERED", ownerName: ["Peanuts Worldwide LLC (LIMITED LIABILITY COMPANY; DELAWARE, USA)"], internationalClass: ["IC 025"], ...extra },
});

describe("parseUsptoResponse", () => {
  it("keeps exact live marks only", () => {
    const json = {
      aggregations: {
        terms: {
          buckets: {
            snoopy: { top: { hits: { hits: [hit("1", "SNOOPY"), hit("2", "SNOOPY'S PIZZA"), hit("3", "Snoopy", { alive: false })] } } },
            mahjong: { top: { hits: { hits: [hit("4", "MAMA MAHJONG")] } } },
          },
        },
      },
    };

    const result = parseUsptoResponse(json, ["snoopy", "mahjong"]);

    expect(result.snoopy).toEqual([
      { serial: "1", wordmark: "SNOOPY", owner: "Peanuts Worldwide LLC", registered: true, status: "REGISTERED", classes: ["025"] },
    ]);
    expect(result.mahjong).toEqual([]);
  });

  it("refuses an answer that is not a search result", () => {
    expect(() => parseUsptoResponse({ error: "nope" }, ["snoopy"])).toThrow();
  });

  it("builds one bucket per phrase", () => {
    expect(Object.keys(usptoQuery(["bluey", "bts"]).aggs.terms.filters.filters)).toEqual(["bluey", "bts"]);
  });
});

describe("trademarkVerdict", () => {
  const mark = (registered: boolean, classes: string[]): TrademarkMark => ({
    serial: "1",
    wordmark: "X",
    owner: "",
    registered,
    status: "",
    classes,
  });

  it("calls a registered mark on clothing a trademark", () => {
    const verdict = trademarkVerdict("snoopy png", () => [mark(true, ["025"])]);
    expect(verdict).toMatchObject({ term: "snoopy", level: "registered" });
  });

  it("calls a pending application, or a mark on other goods, possible", () => {
    expect(trademarkVerdict("jimothy png", () => [mark(false, ["028"])])?.level).toBe("possible");
    expect(trademarkVerdict("showgirl png", () => [mark(true, ["041"])])?.level).toBe("possible");
  });

  it("is null when clear and undefined while still checking", () => {
    expect(trademarkVerdict("mahjong png", () => [])).toBeNull();
    expect(trademarkVerdict("mahjong png", () => undefined)).toBeUndefined();
    expect(trademarkVerdict("funny cat tee", () => undefined)).toBeNull();
  });
});
