import { describe, expect, it } from "vitest";

import { buildReport } from "../src/lib/analysis.js";
import { esc, renderReportBody, renderStandaloneReport, reportCsv, reportFileName } from "../src/lib/report-html.js";
import { NOW, row, settings, snapshot } from "./fixtures.js";

const EVIL = '<img src=x onerror="alert(1)">';

function goReport(overrides = {}) {
  const snap = snapshot([10, 20, 30], { listingOverrides: { title: EVIL } });
  snap.shops[1001].name = EVIL;
  const run = {
    seed: "pet oil painting",
    productType: "any",
    keywords: { source: "erank", usable: [row("a b", 3000), row(EVIL, 2000)], rejected: [] },
    snapshots: { "a b": snap, [EVIL.toLowerCase()]: snapshot([40, 50, 60], { idBase: 10 }) },
    audits: [{ keyword: "a b", listingId: 1 }],
    ...overrides,
  };
  return buildReport({ id: "r1", run, settings: settings(), now: NOW });
}

describe("esc", () => {
  it("neutralises every HTML-significant character", () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("renderReportBody", () => {
  it("never lets listing, shop or keyword text become markup", () => {
    const html = renderReportBody(goReport());

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("renders a GO report with its opportunities and audit", () => {
    const html = renderReportBody(goReport());

    expect(html).toContain("nd-hero--go");
    expect(html).toContain("Niche Report: Pet Oil Painting");
    expect(html).toContain("Keyword opportunities");
    expect(html).toContain("Listing audit — 1 winning listing");
    expect(html).toContain('href="https://www.etsy.com/listing/1"');
  });

  it("renders the next-steps advice for a report stopped at Step 1", () => {
    const report = buildReport({
      id: "r2",
      run: { seed: "pet beg", productType: "any", keywords: { source: "erank", usable: [], rejected: [] } },
      settings: settings({ minQualifiedKeywords: 5 }),
      now: NOW,
    });

    const html = renderReportBody(report);

    expect(html).toContain("nd-hero--nogo");
    expect(html).toContain("What to do next");
    expect(html).toContain("shortfall: <strong>5</strong>");
  });
});

describe("downloads", () => {
  it("wraps the report in a complete, self-styled HTML document", () => {
    const doc = renderStandaloneReport(goReport());

    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).toContain("<style>");
    expect(doc).not.toContain("<script");
  });

  it("names files after the seed, date and verdict", () => {
    const report = goReport();

    expect(reportFileName(report)).toBe("niche_report_pet_oil_painting_2026-09-11_GO.html");
    expect(reportFileName({ ...report, verdict: "NO-GO" }, "csv")).toBe("niche_report_pet_oil_painting_2026-09-11_NOGO.csv");
  });

  it("exports one CSV row per evaluated keyword, quoting where needed", () => {
    const lines = reportCsv(goReport()).split("\r\n");

    expect(lines[0]).toMatch(/^Keyword,Score,Status/);
    expect(lines).toHaveLength(3);
    expect(lines.some((line) => line.startsWith('"<img src=x onerror=""alert(1)"">"'))).toBe(true);
  });
});
