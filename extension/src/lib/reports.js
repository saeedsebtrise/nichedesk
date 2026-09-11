import { normalizeKeyword } from "./analysis.js";

/**
 * Report history in chrome.storage.local: each report under its own key, plus
 * a small index for the popup and a per-seed record for the "already
 * researched" warning.
 */

const MAX_REPORTS = 30;
const reportKey = (id) => `report:${id}`;

export async function saveReport(report, storage = chrome.storage.local) {
  const { reportIndex = [], seedIndex = {} } = await storage.get(["reportIndex", "seedIndex"]);

  const entry = {
    id: report.id,
    seed: report.seed,
    verdict: report.verdict,
    reason: report.reason,
    qualified: report.stats.qualified,
    evaluated: report.stats.evaluated,
    createdAt: report.createdAt,
  };
  const index = [entry, ...reportIndex.filter((item) => item.id !== report.id)];
  const dropped = index.slice(MAX_REPORTS);

  const seed = normalizeKeyword(report.seed);
  const previous = seedIndex[seed];
  seedIndex[seed] = {
    runs: (previous?.runs ?? 0) + 1,
    lastRunAt: report.createdAt,
    keywords: report.stats.keywordsFound,
    listings: report.stats.listings,
    verdict: report.verdict,
    reportId: report.id,
  };

  await storage.set({
    [reportKey(report.id)]: report,
    reportIndex: index.slice(0, MAX_REPORTS),
    seedIndex,
  });
  if (dropped.length) await storage.remove(dropped.map((item) => reportKey(item.id)));
}

export async function getReport(id, storage = chrome.storage.local) {
  const key = reportKey(id);
  return (await storage.get(key))[key] ?? null;
}

export async function listReports(storage = chrome.storage.local) {
  return (await storage.get("reportIndex")).reportIndex ?? [];
}

export async function getSeedInfo(seed, storage = chrome.storage.local) {
  const { seedIndex = {} } = await storage.get("seedIndex");
  return seedIndex[normalizeKeyword(seed)] ?? null;
}
