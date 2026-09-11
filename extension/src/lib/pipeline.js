import { analyseKeyword, buildReport, filterKeywords, matchesProductType, selectAudits } from "./analysis.js";

/**
 * The four-step run. Everything with side effects arrives through `deps`, so
 * the whole flow runs in tests against fakes (test/pipeline.test.js).
 *
 *   1  Keywords   eRank rows → filters → usable keywords
 *   2  Snapshots  Etsy API: top listings and their shops for each keyword
 *   3  Audit      pick the winning listings held by small shops
 *   4  Report     judge GO / NO-GO with the settings in force now
 *
 * Each step saves the run, so any later step can be re-run on its own.
 */

export class PipelineError extends Error {
  constructor(message) {
    super(message);
    this.name = "PipelineError";
  }
}

const SOURCE_LABEL = { erank: "eRank", "erank-open-tab": "your eRank tab", csv: "the CSV" };

const fatal = (error) =>
  error?.name === "AbortError" || error?.status === 401 || error?.status === 403 || error?.status === 0;

export async function runPipeline({ from = 1, input = {}, settings, deps, signal }) {
  const stopIfAsked = () => {
    if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
  };

  let run;
  if (from === 1) {
    const seed = String(input.seed ?? "").trim();
    if (!seed) throw new PipelineError("Enter a seed keyword first.");
    run = { seed, productType: input.productType ?? "any", startedAt: deps.now().toISOString() };
  } else {
    run = await deps.loadRun();
    if (!run?.keywords) throw new PipelineError("There is no earlier run yet — start the full pipeline first.");
    if (from === 3 && !run.snapshots) throw new PipelineError("Step 3 needs Step 2’s Etsy snapshots first.");
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  if (from <= 1) {
    deps.step(1, `Step 1: eRank keywords for “${run.seed}”`);
    const source = input.csvRows
      ? { rows: input.csvRows, source: "csv", hidden: 0 }
      : await deps.getKeywordRows(run.seed, { useOpenTab: Boolean(input.useOpenTab), signal });

    deps.log(
      `Captured ${source.rows.length} keyword(s) from ${SOURCE_LABEL[source.source]}` +
        (source.hidden ? ` — ${source.hidden} more are locked by your eRank plan and were not read` : ""),
    );

    const filtered = filterKeywords(source.rows, run.seed, settings);
    run.keywords = { source: source.source, hidden: source.hidden, ...filtered };
    delete run.snapshots;
    delete run.audits;
    await deps.saveRun(run);

    deps.log(
      `${filtered.usable.length} usable after filters (≥ ${settings.minSearches} searches, ` +
        `≤ ${settings.maxCompetition} competition, ≥ ${settings.minWords} word(s))`,
    );
  }

  const enough = run.keywords.usable.length >= settings.minQualifiedKeywords;
  if (!enough) {
    deps.log(
      `Only ${run.keywords.usable.length} usable keyword(s); need ${settings.minQualifiedKeywords}. ` +
        "Skipping Steps 2 and 3 to save your eRank searches and Etsy API budget.",
      "warn",
    );
  }
  stopIfAsked();

  // ── Step 2 ────────────────────────────────────────────────────────────────
  if (from <= 2 && enough) {
    const keywords = run.keywords.usable;
    // Extra results leave room to fill the top slots after a product-type filter.
    const fetchLimit =
      run.productType === "any" ? settings.topListings : Math.min(100, settings.topListings * 3);
    run.snapshots = {};

    for (const [index, row] of keywords.entries()) {
      stopIfAsked();
      deps.step(2, "Step 2: Etsy snapshots", `${index + 1}/${keywords.length} · ${row.keyword}`);

      const { total, listings } = await deps.etsy.searchListings(row.keyword, fetchLimit);
      const top = listings.filter((listing) => matchesProductType(listing, run.productType)).slice(0, settings.topListings);
      const extras = await deps.etsy.listingExtras(top.map((listing) => listing.id));

      const shops = {};
      for (const listing of top) {
        const extra = extras.get(listing.id);
        if (extra?.image) listing.image = extra.image;

        let shop = extra?.shop ?? null;
        if (!shop) {
          try {
            shop = await deps.etsy.getShop(listing.shopId);
          } catch (error) {
            if (fatal(error)) throw error;
            deps.log(`Could not load shop ${listing.shopId}: ${error.message}`, "warn");
          }
        }
        if (shop) shops[shop.id] = shop;
      }

      run.snapshots[row.keyword] = { total, listings: top, shops };
      deps.log(`“${row.keyword}”: ${total.toLocaleString("en-US")} Etsy results, checked the top ${top.length}`);
    }

    delete run.audits;
    await deps.saveRun(run);
  }
  stopIfAsked();

  // ── Step 3 ────────────────────────────────────────────────────────────────
  if (from <= 3 && enough && run.snapshots) {
    deps.step(3, "Step 3: Listing audit");
    const context = { settings, productType: run.productType, now: deps.now() };
    const analysed = run.keywords.usable.map((row) =>
      analyseKeyword(row, run.snapshots[row.keyword], context),
    );
    run.audits = selectAudits(analysed, settings);
    await deps.saveRun(run);
    deps.log(`Audited ${run.audits.length} winning listing(s) held by small shops`);
  }

  // ── Step 4 ────────────────────────────────────────────────────────────────
  deps.step(4, "Step 4: Report");
  const report = buildReport({ id: deps.newId(), run, settings, now: deps.now() });
  await deps.saveReport(report);
  deps.log(`Step 4 done: “${run.seed}” → ${report.verdict} (${report.headline.replace(/^[A-Z-]+ — /, "")})`);

  return report;
}
