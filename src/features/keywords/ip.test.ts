import { describe, expect, it } from "vitest";

import { catalogMatch, classifyDescription, ipResult, trademarkBehind, type IpLookups, type Lookup, type WikiFact } from "./ip";
import type { TrademarkMark } from "./trademarks";

const done = <T,>(value: T): Lookup<T> => ({ state: "done", value });

const page = (title: string, description: string, extra: Partial<NonNullable<WikiFact>> = {}): WikiFact => ({
  title,
  description,
  disambiguation: false,
  exact: true,
  ...extra,
});

/** Lookups answered from a fixed table; phrases not in it have no Wikipedia page and no marks. */
const lookups = (wiki: Record<string, WikiFact>, marks: Record<string, TrademarkMark[]> = {}): IpLookups => ({
  wiki: (term) => done(wiki[term] ?? null),
  uspto: (term) => done(marks[term] ?? []),
});

const WIKI: Record<string, WikiFact> = {
  strawberry: page("Strawberry", "Edible fruit"),
  crochet: page("Crochet", "Technique of creating lace or fabric from thread using a hook"),
  bag: page("Bag", "Flexible container"),
  cardigan: page("Cardigan", "Topics referred to by the same term", { disambiguation: true }),
  bow: page("Bow", "Topics referred to by the same term", { disambiguation: true }),
  zendaya: page("Zendaya", "American actress (born 1996)"),
  "mama bear": page("Goldilocks and the Three Bears", "19th-century British fairy tale", { exact: false }),
  jimothy: page("Jimothy", "Raccoon and internet meme (born c. 2025)"),
};

const statusOf = (keyword: string) => ipResult(keyword, lookups(WIKI))?.status;

describe("ipResult", () => {
  it.each([
    ["mickey mouse birthday shirt", "yes"],
    ["salman khan fan shirt", "yes"],
    ["Shah Rukh Khan poster", "yes"],
    ["disney princess birthday", "yes"],
    ["HUNTR/X png", "yes"],
    ["Pokémon party", "yes"],
    ["spider-man cake topper", "yes"],
    ["nike swoosh svg", "yes"],
    ["zendaya poster", "yes"],
    ["lilo stitch shirt", "yes"],
    ["stitch crochet pattern", "possible"],
    ["jimothy plush", "possible"],
    ["strawberry first birthday", "no"],
    ["pink bow birthday invitation", "no"],
    ["floral baby shower", "no"],
    ["handmade gift", "no"],
    ["crochet blanket", "no"],
    ["crochet patterns", "no"],
    ["crochet bag", "no"],
    ["crochet cardigan", "no"],
    ["cross stitch pattern", "no"],
    ["mama bear shirt", "no"],
  ])("%s → %s", (keyword, status) => {
    expect(statusOf(keyword)).toBe(status);
  });

  it("names the reason", () => {
    expect(catalogMatch("mickey mouse birthday shirt")).toMatchObject({ category: "CHARACTER", matched: "mickey mouse", detail: "Disney" });
    expect(ipResult("zendaya poster", lookups(WIKI))).toMatchObject({ category: "CELEBRITY", source: "wikipedia" });
  });

  it("keeps a name the built-in list calls possible at possible, whatever Wikipedia says", () => {
    const wiki = { cricut: page("Cricut", "American-based brand of cutting plotter") };

    expect(ipResult("cricut svg", lookups(wiki))).toMatchObject({ status: "possible", source: "catalog" });
  });

  it("flags an invented word with a live trademark on products as possible", () => {
    const mark: TrademarkMark = { serial: "1", wordmark: "GLIMMERZ", owner: "Glim Co", registered: true, status: "", classes: ["025"] };

    expect(ipResult("glimmerz shirt", lookups({}, { glimmerz: [mark] }))).toMatchObject({ status: "possible", source: "uspto" });
  });

  it("waits while a lookup is on its way, and says unchecked when one failed", () => {
    const pending: IpLookups = { wiki: () => ({ state: "pending" }), uspto: () => ({ state: "pending" }) };
    const failed: IpLookups = { wiki: () => ({ state: "failed" }), uspto: () => ({ state: "failed" }) };

    expect(ipResult("glimmerz shirt", pending)).toBeUndefined();
    expect(ipResult("glimmerz shirt", failed)?.status).toBe("unchecked");
    // The built-in list does not wait for anything.
    expect(ipResult("harry potter shirt", pending)?.status).toBe("yes");
  });

  it("shows the USPTO marks behind a YES as the trademark badge", () => {
    const mark: TrademarkMark = { serial: "2", wordmark: "SNOOPY", owner: "Peanuts", registered: true, status: "", classes: ["025"] };
    const check = lookups({}, { snoopy: [mark] });

    expect(trademarkBehind(ipResult("snoopy png", check), check.uspto)).toMatchObject({ term: "snoopy", level: "registered" });
    expect(trademarkBehind(ipResult("crochet bag", lookups(WIKI, { bag: [mark] })), check.uspto)).toBeNull();
  });
});

describe("classifyDescription", () => {
  it.each([
    ["Disney cartoon character and mascot", "CHARACTER"],
    ["Indian actor and film producer (born 1965)", "CELEBRITY"],
    ["American athletic equipment company", "BRAND"],
    ["Japanese media franchise", "FRANCHISE"],
    ["South Korean boy band", "CELEBRITY"],
    ["American television series (2016–2025)", "OTHER_IP"],
    ["NFL team in Kansas City, Missouri", "OTHER_IP"],
  ])("%s → %s", (description, category) => {
    expect(classifyDescription(description)?.category).toBe(category);
  });

  it.each(["Edible fruit", "Legendary Christmas figure", "Species of salamander", "Annual celebration held on 31 October", "Sufi mystic and poet (1207–1273)", "Name list"])(
    "%s → not IP",
    (description) => {
      expect(classifyDescription(description)).toBeNull();
    },
  );
});
