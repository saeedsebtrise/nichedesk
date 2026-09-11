import { describe, expect, it } from "vitest";

import {
  WINNER_THRESHOLD,
  analyseKeyword,
  auditListing,
  averagePrice,
  buildReport,
  filterKeywords,
  isBeatable,
  isWinner,
  matchesProductType,
  seedWords,
  selectAudits,
  winnerScore,
} from "../src/lib/analysis.js";
import { NOW, daysAgo, listing, row, settings, shop, snapshot } from "./fixtures.js";

const context = (overrides = {}) => ({ settings: settings(overrides), productType: "any", now: NOW });

describe("seedWords", () => {
  it("keeps meaningful words once, lower-cased", () => {
    expect(seedWords("Gift for a Pharmacist gift")).toEqual(["gift", "pharmacist"]);
  });
});

describe("filterKeywords", () => {
  const rows = [
    row("pet blanket", 1512, 44649),
    row("personalized pet blanket", 2240, 9800),
    row("dog", 5000, 1000),
    row("cat bed", 200, 100),
    row("PERSONALIZED  pet blanket", 9999, 1),
  ];

  it("rejects rows outside the eRank filters, with a reason each", () => {
    const { usable, rejected } = filterKeywords(rows, "pet blanket", settings());

    expect(usable.map((r) => r.keyword)).toEqual(["dog", "personalized pet blanket"]);
    expect(rejected).toEqual([
      expect.objectContaining({ keyword: "pet blanket", reason: "Over 25,000 competition" }),
      expect.objectContaining({ keyword: "cat bed", reason: "Under 500 searches" }),
    ]);
  });

  it("drops a duplicate that differs only in case or spacing", () => {
    const { usable, rejected } = filterKeywords(rows, "pet blanket", settings());

    expect([...usable, ...rejected].filter((r) => r.keyword === "personalized pet blanket")).toHaveLength(1);
  });

  it("enforces a minimum word count", () => {
    const { rejected } = filterKeywords(rows, "pet blanket", settings({ minWords: 2 }));

    expect(rejected).toContainEqual(expect.objectContaining({ keyword: "dog", reason: "Fewer than 2 words" }));
  });

  it("requires a seed word when asked, accepting plurals", () => {
    const { usable, rejected } = filterKeywords(
      [row("blankets for pets", 900, 100), row("dog bed", 900, 100)],
      "pet blanket",
      settings({ requireSeedWord: true }),
    );

    expect(usable.map((r) => r.keyword)).toEqual(["blankets for pets"]);
    expect(rejected).toContainEqual(expect.objectContaining({ keyword: "dog bed", reason: "No seed word" }));
  });

  it("ranks by searches and caps the list, explaining the overflow", () => {
    const { usable, rejected } = filterKeywords(
      [row("a b", 600), row("c d", 900), row("e f", 700)],
      "x",
      settings({ maxKeywords: 2 }),
    );

    expect(usable.map((r) => r.keyword)).toEqual(["c d", "e f"]);
    expect(rejected).toContainEqual(expect.objectContaining({ keyword: "a b", reason: "Beyond the 2-keyword cap" }));
  });
});

describe("matchesProductType", () => {
  it("maps Etsy listing types onto the product filter", () => {
    const types = ["physical", "download", "both", null];
    const pick = (productType) => types.filter((type) => matchesProductType({ type }, productType));

    expect(pick("any")).toEqual(types);
    expect(pick("digital")).toEqual(["download", "both"]);
    expect(pick("physical")).toEqual(["physical", "both", null]);
  });
});

describe("isBeatable", () => {
  it("counts a shop at or under the review cap, and nothing without data", () => {
    const s = settings({ maxShopReviews: 300 });

    expect(isBeatable(shop(1, 300), s)).toBe(true);
    expect(isBeatable(shop(1, 301), s)).toBe(false);
    expect(isBeatable(shop(1, null), s)).toBe(false);
    expect(isBeatable(null, s)).toBe(false);
  });
});

describe("winnerScore", () => {
  it("rates a new, well-favourited listing from a tiny shop as a winner", () => {
    const entry = { rank: 1, listing: listing(1, 1, { favorites: 200, createdAt: daysAgo(60) }), shop: shop(1, 5) };

    expect(winnerScore(entry, settings(), NOW)).toBeGreaterThanOrEqual(WINNER_THRESHOLD);
  });

  it("rates a low-ranked listing from a large shop poorly", () => {
    const entry = { rank: 12, listing: listing(1, 1, { favorites: 3, createdAt: daysAgo(900) }), shop: shop(1, 40_000) };

    expect(winnerScore(entry, settings(), NOW)).toBeLessThan(20);
  });
});

describe("isWinner", () => {
  it("needs both a high score and a small shop", () => {
    expect(isWinner({ beatable: true, score: WINNER_THRESHOLD })).toBe(true);
    expect(isWinner({ beatable: false, score: 95 })).toBe(false);
    expect(isWinner({ beatable: true, score: WINNER_THRESHOLD - 1 })).toBe(false);
  });

  it("never crowns a big shop in a keyword's winner count", () => {
    const busy = snapshot([40_000, 40_000], { listingOverrides: { favorites: 900, createdAt: daysAgo(20) } });

    const result = analyseKeyword(row("a b"), busy, context());

    expect(result.top.every((entry) => entry.score >= WINNER_THRESHOLD)).toBe(true);
    expect(result.winners).toBe(0);
  });
});

describe("averagePrice", () => {
  it("averages only the most common currency", () => {
    expect(
      averagePrice([
        { price: 20, currency: "USD" },
        { price: 40, currency: "USD" },
        { price: 900, currency: "GBP" },
      ]),
    ).toEqual({ currency: "USD", value: 30, sample: 2, of: 3 });
  });

  it("is null without prices", () => {
    expect(averagePrice([{ price: null, currency: null }])).toBeNull();
  });
});

describe("analyseKeyword", () => {
  it("counts beatable slots and qualifies the keyword", () => {
    const result = analyseKeyword(row("pet blanket", 2000), snapshot([10, 50, 9000, 20, 90000]), context());

    expect(result.beatableSlots).toBe(3);
    expect(result.status).toBe("qualified");
    expect(result.top).toHaveLength(5);
    expect(result.etsyResults).toBe(5000);
  });

  it("marks a keyword crowded when too few slots are beatable", () => {
    const result = analyseKeyword(row("x y"), snapshot([9000, 50, 8000, 7000]), context());

    expect(result.status).toBe("crowded");
  });

  it("applies the product type before taking the top listings", () => {
    const snap = snapshot([10, 20, 30]);
    snap.listings[1].type = "download";

    const result = analyseKeyword(row("x y"), snap, { ...context(), productType: "digital" });

    expect(result.top.map((entry) => entry.listing.id)).toEqual([2]);
  });

  it("scores a strong keyword above a weak one", () => {
    const strong = analyseKeyword(row("a b", 9000, 1000), snapshot(Array(12).fill(10)), context());
    const weak = analyseKeyword(row("c d", 500, 24000), snapshot(Array(12).fill(99999)), context());

    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe("auditListing", () => {
  it("points out gaps and demand signals", () => {
    const entry = {
      rank: 2,
      score: 70,
      listing: listing(1, 1, { title: "Dog blanket", tags: ["dog", "blanket"], favorites: 120, createdAt: daysAgo(30) }),
      shop: shop(1, 12),
    };

    const texts = auditListing(entry, "pet blanket", settings(), NOW).notes.map((note) => note.text);

    expect(texts).toEqual(
      expect.arrayContaining([
        "Exact keyword is not in the title",
        "Keyword is not one of its tags",
        "Uses 2 of 13 tags",
        "Short title (11 characters)",
        "Listed 30 days ago and already ranks #2",
        "120 favourites a month",
        "Shop has only 12 reviews",
      ]),
    );
  });
});

describe("selectAudits", () => {
  it("picks beatable listings from qualified keywords, once each, best first, capped", () => {
    const a = analyseKeyword(row("a b"), snapshot([10, 20, 30, 99999]), context());
    const b = analyseKeyword(row("c d"), snapshot([40, 50, 60], { idBase: 3 }), context());
    const crowded = analyseKeyword(row("e f"), snapshot([99999], { idBase: 50 }), context());

    const picked = selectAudits([a, b, crowded], settings({ maxAudits: 4 }));

    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((p) => p.listingId)).size).toBe(4);
    expect(picked.map((p) => p.keyword)).not.toContain("e f");
  });
});

describe("buildReport", () => {
  const baseRun = (usable, snapshots = {}) => ({
    seed: "pet blanket",
    productType: "any",
    keywords: { source: "erank", usable, rejected: [row("cat bed", 100)] },
    snapshots,
  });

  it("stops at NO-GO when Step 1 found too few keywords", () => {
    const report = buildReport({ id: "r", run: baseRun([row("a b")]), settings: settings({ minQualifiedKeywords: 5 }), now: NOW });

    expect(report).toMatchObject({ verdict: "NO-GO", reason: "insufficient-keywords", shortfall: 4 });
    expect(report.captured).toHaveLength(2);
    expect(report.keywords).toEqual([]);
  });

  it("returns GO when enough keywords have beatable top slots", () => {
    const run = baseRun([row("a b", 3000), row("c d", 2000)], {
      "a b": snapshot([10, 20, 30]),
      "c d": snapshot([40, 50, 60], { idBase: 10 }),
    });

    const report = buildReport({ id: "r", run, settings: settings(), now: NOW });

    expect(report.verdict).toBe("GO");
    expect(report.stats).toMatchObject({ evaluated: 2, qualified: 2, listings: 6, shops: 6, avgSearches: 2500 });
    expect(report.stats.avgPrice).toMatchObject({ currency: "USD", value: 30 });
    expect(report.summary).toContain("2 qualified keywords out of 2");
  });

  it("returns NO-GO when established shops hold the top slots", () => {
    const run = baseRun([row("a b"), row("c d")], {
      "a b": snapshot([9000, 9000, 9000]),
      "c d": snapshot([10, 20, 30], { idBase: 10 }),
    });

    const report = buildReport({ id: "r", run, settings: settings(), now: NOW });

    expect(report).toMatchObject({ verdict: "NO-GO", reason: "crowded" });
    expect(report.stats.qualified).toBe(1);
  });

  it("re-judges the same data under new thresholds", () => {
    const run = baseRun([row("a b"), row("c d")], {
      "a b": snapshot([100, 200, 250]),
      "c d": snapshot([100, 200, 250], { idBase: 10 }),
    });

    expect(buildReport({ id: "r", run, settings: settings(), now: NOW }).verdict).toBe("GO");
    expect(buildReport({ id: "r", run, settings: settings({ maxShopReviews: 150 }), now: NOW }).verdict).toBe("NO-GO");
  });

  it("includes audits only when Step 3 has run", () => {
    const run = baseRun([row("a b"), row("c d")], {
      "a b": snapshot([10, 20, 30]),
      "c d": snapshot([40, 50, 60], { idBase: 10 }),
    });

    expect(buildReport({ id: "r", run, settings: settings(), now: NOW }).auditsRun).toBe(false);

    run.audits = [{ keyword: "a b", listingId: 1 }];
    const report = buildReport({ id: "r", run, settings: settings(), now: NOW });
    expect(report.auditsRun).toBe(true);
    expect(report.audits[0]).toMatchObject({ listingId: 1, keyword: "a b" });
  });
});
