/**
 * End-to-end test: the real extension in Microsoft Edge, against
 *   - a real NicheDesk server (licenses + "Send to NicheDesk"), on :3200
 *   - a stand-in eRank Keyword Tool page and Etsy API, on :3300
 *
 *   npm run build && node extension/test/e2e/run.mjs
 *
 * Nothing here contacts eRank or Etsy. Screenshots go to $E2E_SHOTS if set.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright-core";

const ROOT = process.cwd();
const EXTENSION = join(ROOT, "extension");
const DESK = "http://localhost:3200";
const MOCK = "http://localhost:3300";
const ADMIN = "e2e-admin-token-0123456789";
const API_KEY = "test-key";
const SHOTS = process.env.E2E_SHOTS;

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

// ── Stand-in eRank + Etsy ────────────────────────────────────────────────────

const VISIBLE = [
  ["pet blanket", 1512, 44649],
  ["personalized pet blanket", 2240, 9800],
  ["dog blanket with name", 1830, 6400],
  ["cat blanket personalized", 960, 3100],
  ["custom pet blanket", 3120, 18900],
  ["puppy blanket", 410, 2600],
  ["pet memorial blanket", 1210, 12100],
  ["embroidered dog blanket", 740, 4300],
];
const LOCKED = [
  ["pet blanket for couch", 5000, 1000],
  ["waterproof pet blanket", 4000, 2000],
];

/** Shop review counts for the top 12 listings of each keyword. */
const SHOP_REVIEWS = {
  "personalized pet blanket": [12, 40, 5000, 80, 150, 9000, 20, 30000, 200, 60, 700, 90],
  "dog blanket with name": [5000, 8000, 12000, 20, 9000, 15000, 30000, 7000, 6000, 11000, 40000, 2500],
  "cat blanket personalized": [5, 30, 45, 120, 260, 800, 15, 70, 2000, 33, 18, 99],
  "custom pet blanket": [9000, 12000, 30000, 7000, 40000, 11000, 6000, 8000, 15000, 5000, 2500, 900],
  "pet memorial blanket": [100, 250, 300, 301, 5000, 900, 8000, 1200, 700, 3000, 2000, 1500],
  "embroidered dog blanket": [120, 9000, 250, 5000, 8000, 7000, 3000, 6000, 900, 1200, 4000, 2500],
};

const listingsByKeyword = new Map();
const shops = new Map();
let nextListing = 1000;
for (const [keyword, reviews] of Object.entries(SHOP_REVIEWS)) {
  listingsByKeyword.set(
    keyword,
    reviews.map((reviewCount, index) => {
      const id = nextListing++;
      const shopId = 50_000 + (id % 40); // shops repeat across keywords, like real ones
      shops.set(shopId, { shop_id: shopId, shop_name: `MockShop${shopId}`, review_count: reviewCount, review_average: 4.7, transaction_sold_count: reviewCount * 4, shop_location_country_iso: "US", url: `https://www.etsy.com/shop/MockShop${shopId}`, create_date: 1_600_000_000 });
      return {
        listing_id: id,
        shop_id: shopId,
        title: `${keyword} personalised gift ${index + 1}`,
        url: `https://www.etsy.com/listing/${id}/mock`,
        tags: ["pet blanket", keyword, "gift"],
        views: 500 + index * 37,
        num_favorers: 20 + ((index * 53) % 300),
        price: { amount: 2500 + index * 175, divisor: 100, currency_code: "USD" },
        original_creation_timestamp: Math.floor(Date.now() / 1000) - (20 + index * 30) * 86400,
        listing_type: "physical",
      };
    }),
  );
}
const allListings = new Map([...listingsByKeyword.values()].flat().map((l) => [l.listing_id, l]));

function erankPage(keyword) {
  const row = ([k, s, c], locked) =>
    `<tr${locked ? ' class="row-blurred"' : ""}><td>☆</td><td>${k}</td><td>Jul 26</td><td>${s.toLocaleString("en-US")}</td><td>${Math.round(s * 0.8).toLocaleString("en-US")}</td><td>80%</td><td>${c.toLocaleString("en-US")}</td><td>50</td></tr>`;
  const table = `<table><thead><tr><th></th><th>Keywords</th><th>Search Trend</th><th>Avg. Searches</th><th>Avg. Clicks</th><th>Avg. CTR</th><th>Etsy Competition</th><th>KD</th></tr></thead><tbody>${VISIBLE.map((r) => row(r)).join("")}${LOCKED.map((r) => row(r, true)).join("")}</tbody></table>`;
  // Rendered late on purpose, like the real single-page app.
  return `<!doctype html><title>eRank Keyword Tool</title><h1>Keywords related to "${keyword}"</h1>
    <div id="app">Loading…</div><template id="t">${table}</template>
    <script>setTimeout(() => document.getElementById("app").replaceChildren(document.getElementById("t").content.cloneNode(true)), 800)</script>`;
}

const counters = { erank: 0, search: 0, batch: 0, shop: 0 };

const mock = createServer((req, res) => {
  const url = new URL(req.url, MOCK);
  const json = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === "/keyword-tool") {
    counters.erank += 1;
    const keyword = url.searchParams.get("keyword") ?? "";
    if (keyword === "logged out") {
      res.writeHead(302, { location: "/login" });
      return res.end();
    }
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(erankPage(keyword));
  }
  if (url.pathname === "/login") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end('<!doctype html><title>Log in</title><form><input type="email"><input type="password"></form>');
  }

  if (url.pathname.startsWith("/etsy/v3/application/")) {
    if (req.headers["x-api-key"] !== API_KEY) return json(403, { error: "Invalid API key" });
    const path = url.pathname.slice("/etsy/v3/application".length);

    if (path === "/openapi-ping") return json(200, { application_id: 424242 });
    if (path === "/listings/active") {
      counters.search += 1;
      const list = listingsByKeyword.get(url.searchParams.get("keywords")) ?? [];
      return json(200, { count: list.length * 412, results: list.slice(0, Number(url.searchParams.get("limit"))) });
    }
    if (path === "/listings/batch") {
      counters.batch += 1;
      const ids = (url.searchParams.get("listing_ids") ?? "").split(",").map(Number);
      // Even ids come back with their shop; odd ids force a /shops lookup.
      return json(200, {
        results: ids.map((id) => ({
          listing_id: id,
          images: [{ url_170x135: `${MOCK}/img/${id}.png` }],
          ...(id % 2 === 0 ? { shop: shops.get(allListings.get(id).shop_id) } : {}),
        })),
      });
    }
    const shop = path.match(/^\/shops\/(\d+)$/);
    if (shop) {
      counters.shop += 1;
      return shops.has(Number(shop[1])) ? json(200, shops.get(Number(shop[1]))) : json(404, { error: "Not found" });
    }
    return json(404, { error: "Unknown endpoint" });
  }

  if (url.pathname.startsWith("/img/")) {
    res.writeHead(200, { "content-type": "image/svg+xml" });
    return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="170" height="135"><rect width="170" height="135" fill="#f8d9bd"/></svg>');
  }

  res.writeHead(404);
  res.end();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function waitFor(fn, label, timeoutMs = 60_000) {
  const start = Date.now();
  for (;;) {
    const value = await fn().catch(() => null);
    if (value) return value;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

/**
 * The next report tab to open. Waiting for "any new page" is wrong: Step 1's
 * background eRank tab opens first and is closed again by the extension.
 */
function nextReportPage(context) {
  const seen = new Set(context.pages());
  return waitFor(
    async () =>
      context.pages().find((page) => !seen.has(page) && page.url().includes("/src/report/report.html")) ?? null,
    "the report tab",
    90_000,
  );
}

async function desk(method, path, body, admin = false) {
  const response = await fetch(`${DESK}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(admin ? { authorization: `Bearer ${ADMIN}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

// ── Run ──────────────────────────────────────────────────────────────────────

const dataFile = join(ROOT, "data", "e2e.json");
await rm(dataFile, { force: true });

await new Promise((resolve) => mock.listen(3300, resolve));
const server = spawn(process.execPath, [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", "3200"], {
  cwd: ROOT,
  env: { ...process.env, NICHEDESK_DATA_FILE: dataFile, NICHEDESK_ADMIN_TOKEN: ADMIN },
  stdio: "ignore",
});

const profile = await mkdtemp(join(tmpdir(), "nichedesk-e2e-"));
let context;

try {
  await waitFor(async () => (await fetch(`${DESK}/api/data`)).ok, "NicheDesk server");
  const license = await desk("POST", "/api/licenses", { days: 30, maxDevices: 3, note: "e2e" }, true);
  check("admin API issues a license", /^NDSK-/.test(license.key ?? ""), license.key);
  const unauthorised = await fetch(`${DESK}/api/licenses`).then((r) => r.status);
  check("admin API rejects a request without the token", unauthorised === 401 || unauthorised === 503, `HTTP ${unauthorised}`);

  context = await chromium.launchPersistentContext(profile, {
    channel: "msedge",
    headless: true,
    viewport: { width: 1400, height: 1000 },
    args: [
      `--disable-extensions-except=${EXTENSION}`,
      `--load-extension=${EXTENSION}`,
      "--disable-features=DisableLoadExtensionCommandLineSwitch",
    ],
  });

  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker", { timeout: 20_000 }));
  const extensionId = new URL(worker.url()).host;
  check("extension loads and its service worker starts", Boolean(extensionId), extensionId);

  await worker.evaluate(
    async ({ endpoints, settings }) => chrome.storage.local.set({ endpoints, settings }),
    {
      endpoints: { licenseServerUrl: DESK, erankBaseUrl: MOCK, etsyApiBase: `${MOCK}/etsy/v3/application` },
      settings: { etsyApiKey: API_KEY, minQualifiedKeywords: 2, nicheDeskUrl: DESK },
    },
  );

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 400, height: 1400 });
  await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

  // License
  await popup.fill("#licenseKey", license.key.toLowerCase().replace(/-/g, " "));
  await popup.click("#testLicense");
  const licenseText = await waitFor(async () => {
    const text = await popup.textContent("#licenseStatus");
    return text?.startsWith("Valid") ? text : null;
  }, "license check");
  check("license Test shows validity, expiry and device seat", /Valid · expires \d{4}-\d{2}-\d{2} · device 1\/3/.test(licenseText), licenseText);

  await popup.click("#testEtsy");
  const etsyText = await waitFor(async () => {
    const text = await popup.textContent("#etsyStatus");
    return text?.startsWith("Connected") || text?.includes("rejected") ? text : null;
  }, "Etsy ping");
  check("Etsy API Test connects", etsyText.includes("424242"), etsyText);

  if (SHOTS) await popup.screenshot({ path: join(SHOTS, "e2e-popup-settings.png"), fullPage: true });

  // Full pipeline
  await popup.fill("#seed", "pet blanket");
  const reportPagePromise = nextReportPage(context);
  await popup.click("#startFull");
  const reportPage = await reportPagePromise;
  await reportPage.waitForSelector(".nd-hero", { timeout: 30_000 });

  const state = await worker.evaluate(async () => (await chrome.storage.session.get("state")).state);
  check("pipeline finishes in the done state", state?.status === "done", `${state?.status} · ${state?.title}`);

  const verdict = await reportPage.textContent(".nd-verdict strong");
  check("report verdict is GO", verdict === "GO", verdict);
  const rows = await reportPage.locator(".nd-kw").count();
  check("report evaluates the 6 keywords that pass the filters", rows === 6, `${rows} rows`);
  const qualified = await reportPage.locator(".nd-kw .nd-pill--good").count();
  check("3 keywords qualify on beatable slots", qualified === 3, `${qualified} qualified`);
  const captured = await reportPage.textContent(".nd-captured");
  check("locked (blurred) eRank rows are never read", !captured.includes("pet blanket for couch") && !captured.includes("waterproof"));
  check("filtered keywords carry their reason", captured.includes("Over 25,000 competition") && captured.includes("Under 500 searches"));
  const audits = await reportPage.locator(".nd-audit").count();
  check("listing audit lists winning small-shop listings", audits > 0 && audits <= 10, `${audits} audited`);
  check("one eRank page load per run", counters.erank === 1, `${counters.erank}`);
  check("Etsy: one search and one batch call per keyword", counters.search === 6 && counters.batch === 6, `${counters.search} searches, ${counters.batch} batches`);
  check("shops missing from the batch are fetched, and cached across keywords", counters.shop > 0 && counters.shop < 36, `${counters.shop} shop calls`);

  const logText = (await worker.evaluate(async () => (await chrome.storage.session.get("log")).log)).map((l) => l.message).join("\n");
  check("log reports the locked rows it skipped", logText.includes("2 more are locked by your eRank plan"));

  await reportPage.locator(".nd-kw").first().locator("summary").click();
  if (SHOTS) await reportPage.screenshot({ path: join(SHOTS, "e2e-report.png"), fullPage: true });

  // Send to NicheDesk
  await reportPage.click("#openSend");
  await reportPage.waitForFunction(() => document.getElementById("sendParent").options.length >= 1);
  await reportPage.click("#sendGo");
  const sendText = await waitFor(async () => {
    const text = await reportPage.textContent("#sendResult");
    return text && text !== "Sending…" ? text : null;
  }, "send result");
  check("Send to NicheDesk creates the niche and imports qualified keywords", sendText.startsWith("Created the niche and added 3"), sendText);

  const data = await desk("GET", "/api/data");
  const niche = data.niches.find((n) => n.name === "pet blanket");
  const imported = data.keywords.filter((k) => k.nicheId === niche?.id);
  check("NicheDesk workspace now holds the niche with 3 keywords", imported.length === 3, `${imported.length}`);
  check("license keys never appear in /api/data", !JSON.stringify(data).includes("NDSK-"));

  const standalone = await reportPage.evaluate(async () => {
    const { renderStandaloneReport } = await import("../lib/report-html.js");
    const { getReport } = await import("../lib/reports.js");
    const id = new URLSearchParams(location.search).get("id");
    return renderStandaloneReport(await getReport(id));
  });
  check("standalone HTML download is a complete document with no scripts", standalone.startsWith("<!doctype html>") && !standalone.includes("<script"));

  // Duplicate seed warning
  await popup.bringToFront();
  await popup.click("#startFull");
  await popup.waitForSelector("#dupeWarning:not([hidden])", { timeout: 5000 });
  const dupe = await popup.textContent("#dupeText");
  check("re-running a seed asks first", dupe.includes("was researched 1 time(s)"), dupe);
  await popup.click("#dupeCancel");

  // eRank logged out
  await popup.fill("#seed", "logged out");
  await popup.click("#startFull");
  const failed = await waitFor(async () => {
    const s = await worker.evaluate(async () => (await chrome.storage.session.get("state")).state);
    return s?.status === "error" ? s : null;
  }, "logged-out error");
  check("a logged-out eRank stops Step 1 with a clear message", failed.detail.includes("not logged in to eRank"), failed.detail);
  if (SHOTS) await popup.screenshot({ path: join(SHOTS, "e2e-popup-error.png"), fullPage: true });

  // Report re-judged from Step 4 with stricter settings, no new calls
  const before = { ...counters };
  await worker.evaluate(async () => {
    const { settings } = await chrome.storage.local.get("settings");
    await chrome.storage.local.set({ settings: { ...settings, maxShopReviews: 10 } });
  });
  // The logged-out attempt failed inside Step 1 before saving, so the last
  // stored run is still the successful "pet blanket" one.
  const rejudgePage = nextReportPage(context);
  await popup.evaluate(() => chrome.runtime.sendMessage({ type: "run", from: 4, seed: "pet blanket" }));
  const rejudged = await rejudgePage;
  await rejudged.waitForSelector(".nd-hero");
  const newVerdict = await rejudged.textContent(".nd-verdict strong");
  check("Step 4 alone re-judges the stored run under new thresholds", newVerdict === "NO-GO", newVerdict);
  check("…without another eRank search or Etsy call", counters.erank === before.erank && counters.search === before.search);
} catch (error) {
  failures.push(error.message);
  console.error(`  ✗ ${error.message}`);
} finally {
  await context?.close().catch(() => undefined);
  server.kill();
  mock.close();
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
  await rm(dataFile, { force: true }).catch(() => undefined);
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll end-to-end checks passed");
process.exit(failures.length ? 1 : 0);
