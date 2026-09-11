import { parseNumber } from "./csv.js";
import { extractErankKeywords } from "./erank-extract.js";

/**
 * Step 1 source: the user's own eRank Keyword Tool page.
 *
 * One page per run, in the user's signed-in browser, using their own plan's
 * search allowance — the same page they would open by hand. Only official
 * eRank is supported; shared-account resellers are not.
 */

export class ErankError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ErankError";
    this.code = code;
  }
}

const POLL_MS = 1500;
const TIMEOUT_MS = 45_000;

const normalize = (text) => String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();

function waitForComplete(tabId, signal) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      signal?.removeEventListener("abort", onAbort);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new ErankError("eRank took too long to load. Check your connection and run again.", "timeout"));
    }, TIMEOUT_MS);
    const onUpdated = (id, info) => {
      if (id === tabId && info.status === "complete") {
        cleanup();
        resolve();
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Stopped", "AbortError"));
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    signal?.addEventListener("abort", onAbort, { once: true });
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === "complete") {
          cleanup();
          resolve();
        }
      })
      .catch(() => undefined);
  });
}

async function extract(tabId) {
  const [injection] = await chrome.scripting.executeScript({ target: { tabId }, func: extractErankKeywords });
  return injection?.result ?? { loggedOut: false, rows: [], hidden: 0 };
}

const toRow = (raw) => ({
  keyword: raw.keyword,
  searches: parseNumber(raw.searches),
  competition: parseNumber(raw.competition),
  clicks: raw.clicks === "" ? null : parseNumber(raw.clicks),
  ctr: raw.ctr === "" ? null : parseNumber(raw.ctr),
});

/**
 * Reads eRank's keyword table for `seed`, either from a background tab it
 * opens (and closes) or from a Keyword Tool tab the user already has open.
 */
export async function readErankKeywords(seed, { baseUrl, country, useOpenTab, signal, log, sleep }) {
  let tabId;
  let created = false;

  if (useOpenTab) {
    const tabs = await chrome.tabs.query({ url: `${baseUrl}/keyword-tool*` });
    const tab = tabs.find((candidate) => candidate.active) ?? tabs[0];
    if (!tab) {
      throw new ErankError(
        "No eRank Keyword Tool tab is open. Open it and search your seed, or untick “Use my open eRank tab”.",
        "no-tab",
      );
    }
    tabId = tab.id;
    log("Reading your open eRank Keyword Tool tab");
  } else {
    const url =
      `${baseUrl}/keyword-tool?keyword=${encodeURIComponent(seed)}` +
      `&country=${encodeURIComponent(country)}&source=etsy`;
    log(`Opening eRank Keyword Tool for “${seed}” in a background tab`);
    tabId = (await chrome.tabs.create({ url, active: false })).id;
    created = true;
  }

  try {
    await waitForComplete(tabId, signal);

    const deadline = Date.now() + TIMEOUT_MS;
    let result;
    for (;;) {
      if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
      result = await extract(tabId);

      if (result.loggedOut) {
        throw new ErankError(
          `You are not logged in to eRank in this browser. Log in at ${baseUrl}, then run again.`,
          "logged-out",
        );
      }
      if (result.rows.length > 0 || result.hidden > 0) break;
      if (Date.now() > deadline) {
        throw new ErankError(
          "eRank’s keyword table did not load. Open the Keyword Tool once to check it works, then run again.",
          "no-table",
        );
      }
      await sleep(POLL_MS, signal);
    }

    // The table fills in progressively; one more read catches rows that were
    // still rendering on the first pass.
    await sleep(POLL_MS, signal);
    const settled = await extract(tabId);
    if (settled.rows.length > result.rows.length) result = settled;

    if (useOpenTab && result.keywordParam && normalize(result.keywordParam) !== normalize(seed)) {
      log(`Your eRank tab shows “${result.keywordParam}”, not “${seed}” — using what it shows.`, "warn");
    }

    return {
      rows: result.rows.map(toRow),
      hidden: result.hidden,
      source: useOpenTab ? "erank-open-tab" : "erank",
    };
  } finally {
    if (created) chrome.tabs.remove(tabId).catch(() => undefined);
  }
}
