import { describe, expect, it, vi } from "vitest";

import { lookupTrademarks } from "./uspto";

const answer = (buckets: Record<string, string[]>) =>
  new Response(
    JSON.stringify({
      aggregations: {
        terms: {
          buckets: Object.fromEntries(
            Object.entries(buckets).map(([term, wordmarks]) => [
              term,
              {
                top: {
                  hits: {
                    hits: wordmarks.map((wordmark, index) => ({
                      _id: `${term}-${index}`,
                      _source: { wordmark, alive: true, registered: true, ownerName: ["Owner"], internationalClass: ["IC 025"] },
                    })),
                  },
                },
              },
            ]),
          ),
        },
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("lookupTrademarks", () => {
  it("asks the USPTO once, then answers the same phrase from the cache", async () => {
    const fetchImpl = vi.fn(async () => answer({ bluey: ["BLUEY"], "cache test": [] }));

    const first = await lookupTrademarks(["bluey", "Cache Test"], fetchImpl);
    const second = await lookupTrademarks(["bluey"], fetchImpl);

    expect(first.results.bluey).toHaveLength(1);
    expect(first.results["cache test"]).toEqual([]);
    expect(second.results.bluey).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports phrases it could not check instead of failing", async () => {
    const fetchImpl = vi.fn(async () => new Response("busy", { status: 503 }));

    const result = await lookupTrademarks(["never checked"], fetchImpl);

    expect(result).toEqual({ results: {}, failed: ["never checked"] });
  });
});
