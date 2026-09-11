import { describe, expect, it, vi } from "vitest";

import { PipelineError, runPipeline } from "../src/lib/pipeline.js";
import { NOW, row, settings, snapshot } from "./fixtures.js";

/** In-memory stand-ins for chrome.storage, eRank and the Etsy API. */
function harness({ rows, snapshots = {}, shopsFromBatch = true }) {
  const state = { run: null, report: null };
  const allShops = Object.assign({}, ...Object.values(snapshots).map((s) => s.shops));

  const deps = {
    getKeywordRows: vi.fn(async () => ({ rows, source: "erank", hidden: 2 })),
    etsy: {
      searchListings: vi.fn(async (keyword) => {
        const snap = snapshots[keyword];
        return { total: snap.total, listings: snap.listings.map((l) => ({ ...l })) };
      }),
      // Odd ids come back with an image and (optionally) their shop.
      listingExtras: vi.fn(async (ids) => {
        const extras = new Map();
        for (const id of ids) {
          if (id % 2 === 0) continue;
          const shopId = Object.values(snapshots).flatMap((s) => s.listings).find((l) => l.id === id).shopId;
          extras.set(id, { image: `https://i.etsystatic.com/${id}.jpg`, shop: shopsFromBatch ? allShops[shopId] : null });
        }
        return extras;
      }),
      getShop: vi.fn(async (id) => allShops[id]),
    },
    loadRun: async () => structuredClone(state.run),
    saveRun: async (run) => {
      state.run = structuredClone(run);
    },
    saveReport: async (report) => {
      state.report = report;
    },
    newId: () => "report-1",
    now: () => NOW,
    log: vi.fn(),
    step: vi.fn(),
  };
  return { deps, state };
}

const goSnapshots = () => ({
  "a b": snapshot([10, 20, 30, 40]),
  "c d": snapshot([50, 60, 70, 80], { idBase: 10 }),
});

describe("runPipeline", () => {
  it("stops after Step 1 without touching Etsy when keywords are too few", async () => {
    const { deps } = harness({ rows: [row("a b"), row("c d", 10)] });

    const report = await runPipeline({ input: { seed: "pet" }, settings: settings(), deps });

    expect(report).toMatchObject({ verdict: "NO-GO", reason: "insufficient-keywords" });
    expect(deps.etsy.searchListings).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("Skipping Steps 2 and 3"), "warn");
  });

  it("runs every step and returns GO", async () => {
    const { deps, state } = harness({ rows: [row("a b", 3000), row("c d", 2000)], snapshots: goSnapshots() });

    const report = await runPipeline({ input: { seed: "pet" }, settings: settings(), deps });

    expect(report.verdict).toBe("GO");
    expect(deps.etsy.searchListings).toHaveBeenCalledTimes(2);
    expect(state.run.audits.length).toBeGreaterThan(0);
    expect(state.report.id).toBe("report-1");
    expect(deps.step.mock.calls.map(([step]) => step)).toEqual([1, 2, 2, 3, 4]);
  });

  it("fetches a shop one by one only when the batch call did not include it", async () => {
    const { deps, state } = harness({ rows: [row("a b"), row("c d")], snapshots: goSnapshots() });

    await runPipeline({ input: { seed: "pet" }, settings: settings(), deps });

    // Even listing ids had no batch extras, so their shops were looked up directly.
    expect(deps.etsy.getShop).toHaveBeenCalledTimes(4);
    expect(state.run.snapshots["a b"].listings[0].image).toBe("https://i.etsystatic.com/1.jpg");
    expect(state.run.snapshots["a b"].listings[1].image).toBeNull();
  });

  it("uses CSV rows instead of eRank when given", async () => {
    const { deps } = harness({ rows: [], snapshots: goSnapshots() });

    await runPipeline({
      input: { seed: "pet", csvRows: [row("a b"), row("c d")] },
      settings: settings(),
      deps,
    });

    expect(deps.getKeywordRows).not.toHaveBeenCalled();
    expect(deps.etsy.searchListings).toHaveBeenCalledTimes(2);
  });

  it("re-judges from Step 4 with new settings and no network calls", async () => {
    const { deps } = harness({ rows: [row("a b"), row("c d")], snapshots: goSnapshots() });
    await runPipeline({ input: { seed: "pet" }, settings: settings(), deps });
    deps.etsy.searchListings.mockClear();

    const report = await runPipeline({ from: 4, settings: settings({ maxShopReviews: 5 }), deps });

    expect(report.verdict).toBe("NO-GO");
    expect(deps.etsy.searchListings).not.toHaveBeenCalled();
  });

  it("refuses to continue a step without an earlier run", async () => {
    const { deps } = harness({ rows: [] });

    await expect(runPipeline({ from: 2, settings: settings(), deps })).rejects.toThrow(PipelineError);
  });

  it("requires a seed keyword", async () => {
    const { deps } = harness({ rows: [] });

    await expect(runPipeline({ input: { seed: "  " }, settings: settings(), deps })).rejects.toThrow(/seed/);
  });

  it("stops when asked", async () => {
    const { deps } = harness({ rows: [row("a b"), row("c d")], snapshots: goSnapshots() });
    const controller = new AbortController();
    deps.getKeywordRows.mockImplementation(async () => {
      controller.abort();
      return { rows: [row("a b"), row("c d")], source: "erank", hidden: 0 };
    });

    await expect(
      runPipeline({ input: { seed: "pet" }, settings: settings(), deps, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(deps.etsy.searchListings).not.toHaveBeenCalled();
  });
});
