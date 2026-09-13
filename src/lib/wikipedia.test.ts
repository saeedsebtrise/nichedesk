import { describe, expect, it, vi } from "vitest";

import { lookupWikipedia, titleCovers, titleVariants } from "./wikipedia";

describe("titleVariants", () => {
  it("tries sentence case, title case and capitals for short words", () => {
    expect(titleVariants("mickey mouse")).toEqual(["Mickey mouse", "Mickey Mouse"]);
    expect(titleVariants("bts")).toEqual(["Bts", "BTS"]);
  });
});

describe("titleCovers", () => {
  it.each([
    ["The Walt Disney Company", "disney", true],
    ["Spider-Man", "spiderman", true],
    ["Beyoncé", "beyonce", true],
    ["Swifties", "swiftie", true],
    ["Goldilocks and the Three Bears", "mama bear", false],
    ["Abbott Elementary season 2", "teacher appreciation", false],
  ])("%s covers %s → %s", (title, term, expected) => {
    expect(titleCovers(title, term)).toBe(expected);
  });
});

const answer = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("lookupWikipedia", () => {
  it("follows redirects, marks pages about something else, and asks once per phrase", async () => {
    const fetchImpl = vi.fn(async () =>
      answer({
        query: {
          normalized: [{ from: "Disney", to: "Disney" }],
          redirects: [
            { from: "Disney", to: "The Walt Disney Company" },
            { from: "Mama bear", to: "Goldilocks and the Three Bears" },
          ],
          pages: [
            { title: "The Walt Disney Company", description: "American media and entertainment conglomerate" },
            { title: "Goldilocks and the Three Bears", description: "19th-century British fairy tale" },
            { title: "Cardigan", description: "Topics referred to by the same term", pageprops: { disambiguation: "" } },
            { title: "Crochet patterns", missing: true },
            { title: "Crochet Patterns", missing: true },
          ],
        },
      }),
    );

    const first = await lookupWikipedia(["disney", "mama bear", "cardigan", "crochet patterns"], fetchImpl);
    await lookupWikipedia(["disney"], fetchImpl);

    expect(first.results.disney).toMatchObject({ title: "The Walt Disney Company", exact: true, disambiguation: false });
    expect(first.results["mama bear"]).toMatchObject({ exact: false });
    expect(first.results.cardigan).toMatchObject({ disambiguation: true });
    expect(first.results["crochet patterns"]).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports phrases it could not check", async () => {
    const fetchImpl = vi.fn(async () => new Response("down", { status: 503 }));

    expect(await lookupWikipedia(["never answered"], fetchImpl)).toEqual({ results: {}, failed: ["never answered"] });
  });
});
