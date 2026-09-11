import { WINNER_THRESHOLD, isWinner, listingAgeDays } from "./analysis.js";

/**
 * Renders a report as HTML. The same markup drives the in-extension report
 * page and the standalone .html download, so the two always match.
 *
 * Everything from Etsy or eRank — titles, shop names, keywords — goes through
 * `esc` before it touches markup: a listing title is data written by a
 * stranger and must never be able to inject HTML.
 */

export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

const num = (value) => (Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "—");

function money(value, currency) {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

let regionNames;
function countryName(iso) {
  if (!iso) return null;
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

const titleCase = (text) => String(text).replace(/\b\w/g, (c) => c.toUpperCase());
const day = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export const PRODUCT_TYPES = { any: "Any", digital: "Digital only", physical: "Physical only" };
const SOURCES = {
  erank: "eRank Keyword Tool",
  "erank-open-tab": "your open eRank tab",
  csv: "eRank CSV import",
};
const STATUS = {
  qualified: ["Qualified", "good"],
  crowded: ["Crowded", "bad"],
  "no-listings": ["No listings", "muted"],
  "no-data": ["Not checked", "muted"],
  usable: ["Usable", "good"],
  rejected: ["Filtered out", "muted"],
};

function pill(status) {
  const [label, tone] = STATUS[status] ?? [status, "muted"];
  return `<span class="nd-pill nd-pill--${tone}">${esc(label)}</span>`;
}

function listingCard(entry, now) {
  const { listing, shop, rank, beatable, score } = entry;
  const age = listingAgeDays(listing, now);
  const link = (url, text, cls) =>
    url
      ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`
      : `<span class="${cls}">${esc(text)}</span>`;

  const facts = [
    `<span class="nd-chip">#${rank}</span>`,
    `<span class="nd-chip nd-chip--score${isWinner(entry) ? " nd-chip--win" : ""}">🏆 ${score}/100</span>`,
    Number.isFinite(listing.price) ? `<span class="nd-fact">${esc(money(listing.price, listing.currency))}</span>` : "",
    Number.isFinite(listing.favorites) ? `<span class="nd-fact">♥ ${num(listing.favorites)} favourites</span>` : "",
    Number.isFinite(listing.views) ? `<span class="nd-fact">${num(listing.views)} views</span>` : "",
    age !== null ? `<span class="nd-fact">Listed ${num(age)} days ago</span>` : "",
  ].join("");

  const shopLines = shop
    ? [
        link(shop.url, shop.name || `Shop ${listing.shopId}`, "nd-shop__name"),
        `<span>★ ${Number.isFinite(shop.reviewAverage) ? shop.reviewAverage.toFixed(1) : "—"} · ${num(shop.reviewCount)} reviews</span>`,
        Number.isFinite(shop.sales) ? `<span>${num(shop.sales)} sales</span>` : "",
        shop.createdAt ? `<span>Since ${new Date(shop.createdAt * 1000).getFullYear()}</span>` : "",
        shop.country ? `<span>${esc(countryName(shop.country))}</span>` : "",
      ].join("")
    : `<span class="nd-muted">Shop details unavailable</span>`;

  return `
    <div class="nd-listing${beatable ? " nd-listing--beatable" : ""}">
      ${listing.image ? `<img class="nd-thumb" src="${esc(listing.image)}" alt="" loading="lazy" />` : `<div class="nd-thumb nd-thumb--empty"></div>`}
      <div class="nd-listing__main">
        ${link(listing.url, listing.title || `Listing ${listing.id}`, "nd-listing__title")}
        <div class="nd-facts">${facts}</div>
        <span class="nd-badge nd-badge--${beatable ? "beatable" : "strong"}">${beatable ? "Beatable slot — small shop" : "Established shop"}</span>
      </div>
      <aside class="nd-shop"><span class="nd-shop__label">Shop</span>${shopLines}</aside>
    </div>`;
}

function keywordRow(keyword, report, now) {
  const top = keyword.top ?? [];
  const share = top.length ? Math.round((keyword.beatableSlots / top.length) * 100) : 0;
  const scoreTone = keyword.score >= 50 ? "high" : keyword.score >= 35 ? "mid" : "low";
  const listings = [...top].sort((a, b) => b.score - a.score);

  return `
    <details class="nd-kw">
      <summary class="nd-kw__row">
        <span class="nd-kw__name">${esc(keyword.keyword)}</span>
        <span><span class="nd-score nd-score--${scoreTone}">${keyword.score.toFixed(1)}</span></span>
        <span class="nd-num">${num(keyword.searches)}</span>
        <span class="nd-num">${num(keyword.competition)}</span>
        <span class="nd-num">${Number.isFinite(keyword.ctr) ? `${num(keyword.ctr)}%` : "—"}</span>
        <span class="nd-beat">
          <span class="nd-beat__text"><strong>${keyword.beatableSlots}</strong>/${top.length}</span>
          <span class="nd-bar"><span style="width:${share}%"></span></span>
        </span>
        <span class="nd-num">${num(keyword.medianFavorites)}</span>
        <span class="nd-num">${num(keyword.etsyResults)}</span>
        <span>${pill(keyword.status)}</span>
      </summary>
      <div class="nd-kw__body">
        <p class="nd-kw__caption">Top ${top.length} listings for “${esc(keyword.keyword)}” — sorted by winner score (${WINNER_THRESHOLD}+ from a small shop marks a winner)</p>
        ${listings.length ? listings.map((entry) => listingCard(entry, now)).join("") : `<p class="nd-muted">No active listings matched this keyword${report.productType !== "any" ? " and product type" : ""}.</p>`}
      </div>
    </details>`;
}

function tiles(report) {
  const { stats } = report;
  const price = stats.avgPrice ? money(stats.avgPrice.value, stats.avgPrice.currency) : "—";
  const items = [
    ["Keywords", num(stats.evaluated || stats.usable)],
    ["Qualified", `${stats.qualified}/${stats.evaluated}`],
    ["Listings", num(stats.listings)],
    ["Shops", num(stats.shops)],
    ["Avg price", price],
    ["Avg searches", num(stats.avgSearches)],
    ["Avg comp", num(stats.avgCompetition)],
  ];
  return `<section class="nd-tiles">${items
    .map(([label, value]) => `<div class="nd-tile"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`)
    .join("")}</section>`;
}

function capturedTable(report, open) {
  const rows = report.captured ?? [];
  return `
    <details class="nd-card nd-captured"${open ? " open" : ""}>
      <summary><h2>Keywords captured for “${esc(report.seed)}” (${rows.length})</h2></summary>
      ${
        rows.length
          ? `<div class="nd-table-wrap"><table class="nd-table">
        <thead><tr><th>Keyword</th><th>Avg searches</th><th>Competition</th><th>Click rate</th><th>Status</th></tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr>
              <td>${esc(row.keyword)}</td>
              <td class="nd-num">${num(row.searches)}</td>
              <td class="nd-num">${num(row.competition)}</td>
              <td class="nd-num">${Number.isFinite(row.ctr) ? `${num(row.ctr)}%` : "—"}</td>
              <td>${pill(row.status)}${row.reason ? ` <span class="nd-muted">${esc(row.reason)}</span>` : ""}</td>
            </tr>`,
          )
          .join("")}</tbody></table></div>`
          : `<p class="nd-muted">eRank returned no readable keywords for this seed.</p>`
      }
    </details>`;
}

function nextSteps(report) {
  const t = report.thresholds;
  return `
    <section class="nd-card">
      <h2>What to do next</h2>
      <ul class="nd-list">
        <li><strong>Lower the bar.</strong> Settings → Niche qualification → <em>Min qualified keywords</em> is ${t.minQualifiedKeywords}; drop it and press <em>Step 4</em> to re-judge without a new search.</li>
        <li><strong>Relax Step 1.</strong> <em>Min searches</em> (${num(t.minSearches)}), <em>Max competition</em> (${num(t.maxCompetition)}) or <em>Min words</em> (${t.minWords}) may be too tight for this niche.</li>
        <li><strong>Try a broader seed.</strong> A wider neighbour of “${esc(report.seed)}” often surfaces more usable long-tail keywords.</li>
        <li><strong>Check the table below.</strong> If most keywords are off-topic, the seed is the problem, not your thresholds.</li>
      </ul>
    </section>`;
}

function audits(report) {
  if (!report.auditsRun) {
    return `<section class="nd-note">Listing audit was not run for this report — press <strong>Step 3</strong> to audit the winning listings.</section>`;
  }
  if (!report.audits.length) {
    return `<section class="nd-note">No listings from small shops were strong enough to audit.</section>`;
  }
  const byId = new Map(report.keywords.flatMap((k) => k.top.map((entry) => [entry.listing.id, entry.listing])));
  return `
    <section>
      <h2 class="nd-h2">Listing audit — ${report.audits.length} winning listing${report.audits.length === 1 ? "" : "s"} from small shops</h2>
      <div class="nd-audits">${report.audits
        .map((audit) => {
          const listing = byId.get(audit.listingId);
          return `<article class="nd-audit">
            <header>
              <span class="nd-chip nd-chip--score${audit.score >= WINNER_THRESHOLD ? " nd-chip--win" : ""}">🏆 ${audit.score}/100</span>
              <span class="nd-muted">#${audit.rank} for “${esc(audit.keyword)}”</span>
            </header>
            ${listing?.url ? `<a class="nd-audit__title" href="${esc(listing.url)}" target="_blank" rel="noopener noreferrer">${esc(listing.title)}</a>` : `<span class="nd-audit__title">${esc(listing?.title ?? "")}</span>`}
            <ul>${audit.notes.map((note) => `<li class="nd-note-${note.tone}">${esc(note.text)}</li>`).join("")}</ul>
          </article>`;
        })
        .join("")}</div>
    </section>`;
}

export function renderReportBody(report) {
  const now = new Date(report.createdAt);
  const go = report.verdict === "GO";
  const insufficient = report.reason === "insufficient-keywords";
  const t = report.thresholds;

  const verdictLine = insufficient
    ? `Usable keywords found: <strong>${report.stats.usable}</strong> · minimum required: <strong>${t.minQualifiedKeywords}</strong> · shortfall: <strong>${report.shortfall}</strong>`
    : `${report.stats.qualified}/${report.stats.evaluated} keywords qualified (need ${t.minQualifiedKeywords})`;

  return `
    <header class="nd-hero nd-hero--${go ? "go" : "nogo"}">
      <p class="nd-hero__eyebrow">NicheDesk niche report · ${esc(day(report.createdAt))}</p>
      <h1>Niche Report: ${esc(titleCase(report.seed))}</h1>
      <p class="nd-hero__sub">Product type: ${esc(PRODUCT_TYPES[report.productType] ?? report.productType)} · Keywords from ${esc(SOURCES[report.source] ?? "eRank")}</p>
      <div class="nd-verdict">
        <span class="nd-verdict__mark">${go ? "✓" : "✕"}</span>
        <div><strong>${esc(report.verdict)}</strong><span>${verdictLine}</span></div>
      </div>
    </header>

    <section class="nd-summary"><p>${esc(report.summary)}</p></section>

    ${insufficient ? nextSteps(report) + capturedTable(report, true) : `
    ${tiles(report)}

    <section>
      <h2 class="nd-h2">Keyword opportunities</h2>
      <details class="nd-card nd-howto">
        <summary>How are the scores calculated?</summary>
        <div class="nd-howto__body">
          <p><strong>Keyword score (0–100)</strong> — searches 35 (10,000 a month scores full, on a log scale), beatable share 35 (how many of the top ${t.topListings} are held by shops with ${num(t.maxShopReviews)} reviews or fewer), competition 15 (how far under your ${num(t.maxCompetition)} limit), demand 15 (median favourites of the top listings, 500 scores full).</p>
          <p><strong>Winner score (0–100)</strong> — demand 50 (favourites per month since listing, 50 scores full), small shop 30 (fewer shop reviews scores higher), position 20 (rank #1 scores full). ${WINNER_THRESHOLD}+ on a listing from a small shop marks a <em>winner</em> — proof a new seller can rank here. Big shops can score high on favourites alone, so they never count as winners.</p>
          <p><strong>Qualified</strong> — at least ${t.minBeatableSlots} of the top ${t.topListings} listings are beatable slots.</p>
        </div>
      </details>
      <p class="nd-muted nd-hint">Ranked by keyword score. Click a row to see its top listings.</p>
      <div class="nd-kw-table">
        <div class="nd-kw__row nd-kw__head">
          <span>Keyword</span><span>Score</span><span class="nd-num">Searches</span><span class="nd-num">Competition</span><span class="nd-num">CTR</span><span>Beatable</span><span class="nd-num">Med. favs</span><span class="nd-num">Etsy results</span><span>Status</span>
        </div>
        ${report.keywords.map((keyword) => keywordRow(keyword, report, now)).join("")}
      </div>
    </section>

    ${audits(report)}
    ${capturedTable(report, false)}`}

    <footer class="nd-footer">
      NicheDesk Research · Etsy data from the official Etsy Open API · ${esc(day(report.createdAt))}<br />
      Top listings follow the API’s relevance ranking, which can differ slightly from what a signed-in shopper sees on etsy.com.
    </footer>`;
}

export const REPORT_CSS = `
:root{--cream:#fffaf5;--cream2:#fff4ea;--line:#f3dcc6;--brand:#f4671f;--brand2:#e2560f;--ink:#24170f;--ink7:#5c4636;--ink5:#8a7263;--good:#0f766e;--bad:#b42318}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,var(--cream),var(--cream2));color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.nd-report{max-width:1180px;margin:0 auto;padding:28px 20px 60px}
a{color:inherit}
.nd-hero{position:relative;overflow:hidden;border-radius:24px;padding:34px 40px;color:#fff;box-shadow:0 24px 50px -24px rgba(36,23,15,.45)}
.nd-hero::after{content:"";position:absolute;right:-120px;top:-140px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.08)}
.nd-hero--go{background:linear-gradient(135deg,#0f766e,#059669 60%,#10b981)}
.nd-hero--nogo{background:linear-gradient(135deg,#9f1239,#b42318 55%,#dc2626)}
.nd-hero__eyebrow{margin:0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
.nd-hero h1{margin:8px 0 4px;font-size:34px;line-height:1.1;letter-spacing:-.02em}
.nd-hero__sub{margin:0;opacity:.85}
.nd-verdict{position:relative;z-index:1;display:flex;align-items:center;gap:18px;margin-top:26px}
.nd-verdict__mark{display:grid;place-items:center;width:64px;height:64px;border-radius:18px;background:rgba(255,255,255,.18);font-size:34px;font-weight:800}
.nd-verdict strong{display:block;font-size:30px;line-height:1;letter-spacing:.02em}
.nd-verdict span{display:block;margin-top:6px;opacity:.92}
.nd-summary{margin:22px 0;padding:18px 24px;border-left:4px solid var(--brand);border-radius:16px;background:#fff;box-shadow:0 1px 2px rgba(36,23,15,.06)}
.nd-summary p{margin:0;color:var(--ink7)}
.nd-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:0 0 30px}
.nd-tile{padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:#fff}
.nd-tile span{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink5)}
.nd-tile strong{display:block;margin-top:6px;font-size:24px;letter-spacing:-.01em}
.nd-h2,.nd-card h2{margin:0 0 12px;font-size:20px;letter-spacing:-.01em}
.nd-card{margin:0 0 18px;padding:20px 24px;border:1px solid var(--line);border-radius:18px;background:#fff}
.nd-card>summary{cursor:pointer;list-style:none}
.nd-card>summary::-webkit-details-marker{display:none}
.nd-card>summary h2{display:inline;margin:0}
.nd-howto{padding:14px 20px}
.nd-howto summary{font-weight:700}
.nd-howto__body{margin-top:10px;color:var(--ink7);font-size:14px}
.nd-hint{margin:0 0 10px;font-size:13px}
.nd-kw-table{overflow-x:auto;border:1px solid var(--line);border-radius:18px;background:#fff}
.nd-kw__row{display:grid;grid-template-columns:minmax(170px,1.6fr) 70px 90px 100px 60px 140px 90px 100px 110px;align-items:center;gap:10px;min-width:1000px;padding:13px 18px}
.nd-kw__head{background:var(--cream2);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink5)}
.nd-kw{border-top:1px solid var(--line)}
.nd-kw>summary{cursor:pointer;list-style:none}
.nd-kw>summary::-webkit-details-marker{display:none}
.nd-kw>summary:hover{background:var(--cream)}
.nd-kw[open]>summary{background:var(--cream2)}
.nd-kw__name{font-weight:600;color:var(--brand2)}
.nd-kw__name::before{content:"▸";display:inline-block;margin-right:8px;color:var(--ink5);transition:transform .15s}
.nd-kw[open] .nd-kw__name::before{transform:rotate(90deg)}
.nd-kw__body{min-width:1000px;padding:6px 18px 18px;background:var(--cream)}
.nd-kw__caption{margin:6px 0 12px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink5)}
.nd-num{text-align:right;font-variant-numeric:tabular-nums}
.nd-score{display:inline-block;min-width:48px;padding:3px 9px;border-radius:999px;text-align:center;font-weight:700;font-size:13px}
.nd-score--high{background:#d1fae5;color:#065f46}.nd-score--mid{background:#fef3c7;color:#92400e}.nd-score--low{background:#fee2e2;color:#991b1b}
.nd-beat__text{display:block;font-size:13px}
.nd-bar{display:block;height:6px;margin-top:4px;border-radius:999px;background:#f1e4d8;overflow:hidden}
.nd-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#10b981,#059669)}
.nd-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.nd-pill--good{background:#d1fae5;color:#065f46}.nd-pill--bad{background:#fee2e2;color:#991b1b}.nd-pill--muted{background:#f1e4d8;color:var(--ink7)}
.nd-listing{display:grid;grid-template-columns:72px 1fr 220px;gap:16px;margin-top:10px;padding:14px;border:1px solid var(--line);border-radius:16px;background:#fff}
.nd-listing--beatable{border-color:#a7f3d0;box-shadow:inset 3px 0 0 #10b981}
.nd-thumb{width:72px;height:72px;border-radius:12px;object-fit:cover;background:var(--cream2)}
.nd-listing__title{display:block;font-weight:600;text-decoration:none}
.nd-listing__title:hover{color:var(--brand2);text-decoration:underline}
.nd-facts{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin:8px 0;font-size:13px;color:var(--ink7)}
.nd-chip{padding:2px 8px;border-radius:8px;background:var(--cream2);font-size:12px;font-weight:700;color:var(--ink7)}
.nd-chip--score{background:#fff1e6;color:var(--brand2)}
.nd-chip--win{background:#d1fae5;color:#065f46}
.nd-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.nd-badge--beatable{background:#ecfdf5;color:#047857}.nd-badge--strong{background:#f5ede6;color:var(--ink7)}
.nd-shop{display:flex;flex-direction:column;gap:3px;padding-left:16px;border-left:1px solid var(--line);font-size:13px;color:var(--ink7)}
.nd-shop__label{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink5)}
.nd-shop__name{font-weight:700;color:#0f766e;text-decoration:none}
.nd-audits{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:26px}
.nd-audit{padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:#fff}
.nd-audit header{display:flex;gap:10px;align-items:center;font-size:13px}
.nd-audit__title{display:block;margin:10px 0 8px;font-weight:600;text-decoration:none}
.nd-audit ul{margin:0;padding:0;list-style:none;font-size:13px}
.nd-audit li{padding:3px 0 3px 22px;position:relative}
.nd-audit li::before{position:absolute;left:0;font-weight:800}
.nd-note-gap::before{content:"↗";color:var(--brand2)}
.nd-note-signal::before{content:"●";color:#059669}
.nd-note{margin:26px 0;padding:14px 20px;border-radius:14px;background:#fff7d6;color:#7a5a00;font-size:14px}
.nd-table-wrap{overflow-x:auto;margin-top:12px}
.nd-table{width:100%;border-collapse:collapse;font-size:14px}
.nd-table th{padding:10px 12px;text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink5);background:var(--cream2)}
.nd-table td{padding:10px 12px;border-top:1px solid var(--line)}
.nd-list{margin:0;padding-left:20px;color:var(--ink7)}.nd-list li{margin:6px 0}
.nd-muted{color:var(--ink5)}
.nd-footer{margin-top:40px;text-align:center;font-size:12px;color:var(--ink5)}
@media print{.nd-toolbar,.nd-send{display:none!important}.nd-kw{break-inside:avoid}}
`;

export function renderStandaloneReport(report) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Niche Report: ${esc(titleCase(report.seed))} — ${esc(report.verdict)}</title>
<style>${REPORT_CSS}</style></head>
<body><main class="nd-report">${renderReportBody(report)}</main></body></html>`;
}

export function reportFileName(report, extension = "html") {
  const slug = report.seed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "report";
  return `niche_report_${slug}_${report.createdAt.slice(0, 10)}_${report.verdict.replace("-", "")}.${extension}`;
}

export function reportCsv(report) {
  const cell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = [
    "Keyword", "Score", "Status", "Avg searches", "Competition", "CTR %", "Etsy results",
    "Beatable slots", "Top listings", "Median favourites", "Avg price", "Currency",
  ];
  const rows = report.keywords.map((k) => [
    k.keyword, k.score, k.status, k.searches, k.competition, k.ctr ?? "", k.etsyResults ?? "",
    k.beatableSlots, k.top.length, k.medianFavorites ?? "", k.price?.value ?? "", k.price?.currency ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
