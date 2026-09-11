import { describe, expect, it } from "vitest";

import { defaultMinGroupSize, planSubniches, stem, subnicheName } from "./auto-group";

const names = (plan: ReturnType<typeof planSubniches>) => plan.groups.map((g) => g.name);
const membersOf = (plan: ReturnType<typeof planSubniches>, keywords: string[], name: string) =>
  plan.groups.find((g) => g.name === name)?.members.map((i) => keywords[i]) ?? [];

const PATTERNS = [
  "crochet pattern",
  "crochet pattern for beginners",
  "crochet patterns pdf",
  "easy crochet pattern",
  "sewing pattern",
  "sewing pattern dress",
  "sewing patterns women",
  "knitting pattern",
  "knitting pattern sweater",
  "knitting patterns free",
  "amigurumi pattern",
  "dress pattern",
];

describe("planSubniches", () => {
  it("splits keywords into themed subniches named after their parent", () => {
    const plan = planSubniches(PATTERNS, "Pattern", { minGroupSize: 3 });

    expect(names(plan)).toEqual(["crochet pattern", "knitting pattern", "sewing pattern"]);
    expect(membersOf(plan, PATTERNS, "crochet pattern")).toEqual([
      "crochet pattern",
      "crochet pattern for beginners",
      "crochet patterns pdf",
      "easy crochet pattern",
    ]);
  });

  it("gives each keyword to the biggest theme it belongs to", () => {
    const plan = planSubniches(PATTERNS, "Pattern", { minGroupSize: 3 });

    // "sewing pattern dress" could be dress or sewing; sewing is the bigger theme.
    expect(membersOf(plan, PATTERNS, "sewing pattern")).toContain("sewing pattern dress");
    expect(plan.groups.flatMap((g) => g.members).length + plan.rest.length).toBe(PATTERNS.length);
  });

  it("leaves keywords that fit no theme in the parent", () => {
    const plan = planSubniches(PATTERNS, "Pattern", { minGroupSize: 3 });

    expect(plan.rest.map((i) => PATTERNS[i]).sort()).toEqual(["amigurumi pattern", "dress pattern"]);
  });

  it("never uses the parent's own word, filler words or numbers as a theme", () => {
    const keywords = ["png file 2026", "png digital 2026", "printable png 2026", "free png 2026"];

    const plan = planSubniches(keywords, "png", { minGroupSize: 2 });

    expect(plan.groups).toEqual([]);
    expect(plan.rest).toHaveLength(4);
  });

  it("merges plurals into one theme and labels it with the commonest spelling", () => {
    const keywords = ["dog shirts", "dog shirt", "cat shirts", "shirts for cats", "funny shirts"];

    const plan = planSubniches(keywords, "gifts", { minGroupSize: 3 });

    expect(plan.groups[0]).toMatchObject({ term: "shirt", name: "shirts gifts" });
    expect(plan.groups[0].members).toHaveLength(5);
  });

  it("respects the minimum group size", () => {
    expect(planSubniches(PATTERNS, "Pattern", { minGroupSize: 5 }).groups).toEqual([]);
  });

  it("caps the number of subniches", () => {
    const plan = planSubniches(PATTERNS, "Pattern", { minGroupSize: 2, maxGroups: 1 });

    expect(names(plan)).toEqual(["crochet pattern"]);
  });

  it("is deterministic when themes tie", () => {
    const keywords = ["b one", "b two", "a one", "a two"];

    expect(names(planSubniches(keywords, "x", { minGroupSize: 2 }))).toEqual(
      names(planSubniches([...keywords].reverse(), "x", { minGroupSize: 2 })),
    );
  });
});

describe("helpers", () => {
  it("stems plurals but not words ending in ss", () => {
    expect(stem("shirts")).toBe("shirt");
    expect(stem("dress")).toBe("dress");
    expect(stem("bus")).toBe("bus");
  });

  it("names a subniche after a short parent, or alone under a long one", () => {
    expect(subnicheName("christmas", "png")).toBe("christmas png");
    expect(subnicheName("cricut", "svg files")).toBe("cricut svg files");
    expect(subnicheName("wedding", "gifts for her family")).toBe("wedding");
  });

  it("scales the default minimum with the batch size", () => {
    expect(defaultMinGroupSize(40)).toBe(3);
    expect(defaultMinGroupSize(1096)).toBe(11);
  });
});
