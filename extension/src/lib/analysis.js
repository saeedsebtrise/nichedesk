/**
 * The research rules — pure functions with no chrome.* or network access, so
 * every decision behind a GO / NO-GO is unit-tested (test/analysis.test.js).
 */

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "of", "to", "in", "on", "with", "my", "your", "by", "at",
]);

const DAY_MS = 24 * 60 * 60 * 1000;

export const normalizeKeyword = (text) =>
  String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();

export const wordCount = (keyword) => normalizeKeyword(keyword).split(" ").filter(Boolean).length;

/** Meaningful words of the seed: "gift for a pharmacist" → ["gift", "pharmacist"]. */
export function seedWords(seed) {
  const words = normalizeKeyword(seed)
    .split(" ")
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
  return [...new Set(words)];
}

const fmt = (n) => Number(n).toLocaleString("en-US");

/**
 * Step 1: applies the eRank filters to the keyword rows.
 *
 * Passing keywords are ranked by searches (then lower competition) and capped
 * at `maxKeywords`; every rejected row keeps a plain-language reason so the
 * report can show why it was dropped.
 */
export function filterKeywords(rows, seed, settings) {
  const words = seedWords(seed);
  const seen = new Set();
  const passed = [];
  const rejected = [];

  for (const row of rows) {
    const keyword = normalizeKeyword(row.keyword);
    if (keyword === "" || seen.has(keyword)) continue;
    seen.add(keyword);

    const own = keyword.split(" ");
    // "starts with" so a plural ("blankets") still counts for the seed "blanket".
    const hasSeedWord = words.length === 0 || words.some((w) => own.some((o) => o.startsWith(w)));

    let reason = null;
    if (row.searches < settings.minSearches) reason = `Under ${fmt(settings.minSearches)} searches`;
    else if (row.competition > settings.maxCompetition) {
      reason = `Over ${fmt(settings.maxCompetition)} competition`;
    } else if (wordCount(keyword) < settings.minWords) {
      reason = `Fewer than ${settings.minWords} words`;
    } else if (settings.requireSeedWord && !hasSeedWord) reason = "No seed word";

    if (reason) rejected.push({ ...row, keyword, status: "rejected", reason });
    else passed.push({ ...row, keyword });
  }

  passed.sort((a, b) => b.searches - a.searches || a.competition - b.competition);

  return {
    usable: passed.slice(0, settings.maxKeywords).map((row) => ({ ...row, status: "usable" })),
    rejected: [
      ...rejected,
      ...passed.slice(settings.maxKeywords).map((row) => ({
        ...row,
        status: "rejected",
        reason: `Beyond the ${settings.maxKeywords}-keyword cap`,
      })),
    ],
  };
}

/** Etsy's listing_type is "physical", "download" or "both". */
export function matchesProductType(listing, productType) {
  if (productType === "digital") return listing.type === "download" || listing.type === "both";
  if (productType === "physical") {
    return listing.type === "physical" || listing.type === "both" || listing.type == null;
  }
  return true;
}

/** A top slot is beatable when the shop holding it is still small. */
export function isBeatable(shop, settings) {
  return Boolean(shop) && Number.isFinite(shop.reviewCount) && shop.reviewCount <= settings.maxShopReviews;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** 0 → 0, `full` → 1, on a log curve so the first few units count most. */
const logShare = (value, full) =>
  value > 0 ? clamp01(Math.log10(1 + value) / Math.log10(1 + full)) : 0;
const round1 = (x) => Math.round(x * 10) / 10;

export function listingAgeDays(listing, now) {
  if (!listing.createdAt) return null;
  return Math.max(1, (now.getTime() - listing.createdAt * 1000) / DAY_MS);
}

export function favoritesPerMonth(listing, now) {
  const age = listingAgeDays(listing, now);
  if (age === null || !Number.isFinite(listing.favorites)) return null;
  return listing.favorites / Math.max(1, age / 30);
}

/**
 * Winner score, 0–100: how strongly a listing is winning its search while its
 * shop is still small.
 *   demand   50 — favourites per month since it was listed (50/month = full)
 *   small    30 — how far the shop sits under the review cap (0 reviews = full)
 *   position 20 — its rank in the top listings (#1 = full)
 * 50 or more, on a listing from a small shop, marks a winner worth studying.
 */
export const WINNER_THRESHOLD = 50;

/**
 * A winner is a strong listing held by a small shop — proof a new seller can
 * rank here. A big shop's listing can score 50+ on favourites alone, but that
 * shows the shop's weight, not an opening.
 */
export const isWinner = (entry) => Boolean(entry.beatable) && entry.score >= WINNER_THRESHOLD;

export function winnerScore({ listing, shop, rank }, settings, now) {
  const demand = 50 * logShare(favoritesPerMonth(listing, now) ?? 0, 50);
  const small = isBeatable(shop, settings)
    ? 30 * (1 - shop.reviewCount / Math.max(1, settings.maxShopReviews))
    : 0;
  const position = 20 * (1 - (rank - 1) / Math.max(1, settings.topListings));
  return Math.round(demand + small + position);
}

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const mean = (values) => {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, v) => sum + v, 0) / finite.length : null;
};

/**
 * Average price in the currency most of the listings use. Etsy quotes each
 * listing in its shop's currency, so mixing USD and GBP into one mean would
 * produce a number that means nothing.
 */
export function averagePrice(listings) {
  const byCurrency = new Map();
  for (const listing of listings) {
    if (!Number.isFinite(listing.price) || !listing.currency) continue;
    const bucket = byCurrency.get(listing.currency) ?? [];
    bucket.push(listing.price);
    byCurrency.set(listing.currency, bucket);
  }
  const [currency, prices] = [...byCurrency].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!currency) return null;
  return { currency, value: round1(mean(prices)), sample: prices.length, of: listings.length };
}

/**
 * Keyword opportunity score, 0–100:
 *   searches    35 — eRank average searches (10,000 = full, log scale)
 *   beatable    35 — share of the top listings held by small shops
 *   competition 15 — how far under your max-competition setting it sits
 *   demand      15 — median favourites across the top listings (500 = full)
 */
export function opportunityScore({ searches, competition, beatableShare, medianFavorites }, settings) {
  return round1(
    35 * logShare(searches, 10_000) +
      35 * clamp01(beatableShare) +
      15 * (1 - clamp01(competition / Math.max(1, settings.maxCompetition))) +
      15 * logShare(medianFavorites ?? 0, 500),
  );
}

/** Steps 2–3 for one keyword: its top listings, how many are beatable, its score. */
export function analyseKeyword(row, snapshot, { settings, productType, now }) {
  if (!snapshot) {
    return { ...row, status: "no-data", score: 0, top: [], beatableSlots: 0, etsyResults: null };
  }

  const top = snapshot.listings
    .filter((listing) => matchesProductType(listing, productType))
    .slice(0, settings.topListings)
    .map((listing, index) => {
      const shop = snapshot.shops[listing.shopId] ?? null;
      const entry = { rank: index + 1, listing, shop };
      return {
        ...entry,
        beatable: isBeatable(shop, settings),
        score: winnerScore(entry, settings, now),
      };
    });

  const beatableSlots = top.filter((entry) => entry.beatable).length;
  const medianFavorites = median(top.map((entry) => entry.listing.favorites));

  const score = opportunityScore(
    {
      searches: row.searches,
      competition: row.competition,
      beatableShare: top.length ? beatableSlots / top.length : 0,
      medianFavorites,
    },
    settings,
  );

  let status = "crowded";
  if (top.length === 0) status = "no-listings";
  else if (beatableSlots >= settings.minBeatableSlots) status = "qualified";

  return {
    ...row,
    status,
    score,
    etsyResults: snapshot.total,
    top,
    beatableSlots,
    medianFavorites,
    medianShopReviews: median(top.map((entry) => entry.shop?.reviewCount)),
    price: averagePrice(top.map((entry) => entry.listing)),
    winners: top.filter(isWinner).length,
  };
}

/**
 * Step 3: what a seller can learn from one winning listing. "gap" notes are
 * weaknesses a new listing can beat; "signal" notes are evidence of demand.
 */
export function auditListing(entry, keyword, settings, now) {
  const { listing, shop, rank } = entry;
  const kw = normalizeKeyword(keyword);
  const title = normalizeKeyword(listing.title);
  const tags = (listing.tags ?? []).map(normalizeKeyword);
  const age = listingAgeDays(listing, now);
  const perMonth = favoritesPerMonth(listing, now);
  const notes = [];

  if (!title.includes(kw)) notes.push({ tone: "gap", text: "Exact keyword is not in the title" });
  if (!tags.includes(kw)) notes.push({ tone: "gap", text: "Keyword is not one of its tags" });
  if (tags.length < 13) notes.push({ tone: "gap", text: `Uses ${tags.length} of 13 tags` });
  if (listing.title && listing.title.length < 70) {
    notes.push({ tone: "gap", text: `Short title (${listing.title.length} characters)` });
  }

  if (age !== null && age <= 90) {
    notes.push({ tone: "signal", text: `Listed ${Math.round(age)} days ago and already ranks #${rank}` });
  }
  if (perMonth !== null && perMonth >= 10) {
    notes.push({ tone: "signal", text: `${Math.round(perMonth)} favourites a month` });
  }
  if (isBeatable(shop, settings)) {
    notes.push({ tone: "signal", text: `Shop has only ${fmt(shop.reviewCount)} reviews` });
  }

  return {
    keyword,
    rank,
    listingId: listing.id,
    score: entry.score,
    tagCount: tags.length,
    titleLength: listing.title?.length ?? 0,
    ageDays: age === null ? null : Math.round(age),
    favoritesPerMonth: perMonth === null ? null : round1(perMonth),
    notes,
  };
}

/**
 * Step 3 target list: the strongest listings held by small shops across the
 * qualified keywords, one entry per listing, capped at `maxAudits`.
 */
export function selectAudits(analysed, settings) {
  const seen = new Set();
  return analysed
    .filter((keyword) => keyword.status === "qualified")
    .flatMap((keyword) =>
      keyword.top
        .filter((entry) => entry.beatable)
        .map((entry) => ({ keyword: keyword.keyword, listingId: entry.listing.id, score: entry.score })),
    )
    .sort((a, b) => b.score - a.score)
    .filter((target) => (seen.has(target.listingId) ? false : seen.add(target.listingId)))
    .slice(0, settings.maxAudits)
    .map(({ keyword, listingId }) => ({ keyword, listingId }));
}

/**
 * Step 4: the report, rebuilt from the stored run with the settings in force
 * now — so after tightening a threshold, "Step 4" alone re-judges the niche
 * without spending another eRank search or Etsy API call.
 */
export function buildReport({ id, run, settings, now = new Date() }) {
  const usable = run.keywords?.usable ?? [];
  const captured = [...usable, ...(run.keywords?.rejected ?? [])];
  const base = {
    id,
    seed: run.seed,
    productType: run.productType,
    source: run.keywords?.source ?? null,
    createdAt: now.toISOString(),
    thresholds: {
      minSearches: settings.minSearches,
      maxCompetition: settings.maxCompetition,
      minWords: settings.minWords,
      maxKeywords: settings.maxKeywords,
      topListings: settings.topListings,
      maxShopReviews: settings.maxShopReviews,
      minBeatableSlots: settings.minBeatableSlots,
      minQualifiedKeywords: settings.minQualifiedKeywords,
    },
    captured,
  };

  if (usable.length < settings.minQualifiedKeywords) {
    return {
      ...base,
      verdict: "NO-GO",
      reason: "insufficient-keywords",
      headline: `NO-GO — Not enough keywords for “${run.seed}”`,
      summary:
        `Step 1 found ${usable.length} usable keyword${usable.length === 1 ? "" : "s"} after your eRank filters; ` +
        `you need at least ${settings.minQualifiedKeywords}. Steps 2 and 3 were skipped to save your ` +
        "eRank searches and Etsy API budget.",
      shortfall: settings.minQualifiedKeywords - usable.length,
      keywords: [],
      audits: [],
      stats: {
        keywordsFound: captured.length,
        usable: usable.length,
        evaluated: 0,
        qualified: 0,
        listings: 0,
        shops: 0,
        avgPrice: null,
        avgSearches: null,
        avgCompetition: null,
      },
    };
  }

  const context = { settings, productType: run.productType, now };
  const keywords = usable
    .map((row) => analyseKeyword(row, run.snapshots?.[row.keyword], context))
    .sort((a, b) => b.score - a.score);

  const qualified = keywords.filter((keyword) => keyword.status === "qualified");
  const allTop = keywords.flatMap((keyword) => keyword.top);
  const uniqueListings = new Map(allTop.map((entry) => [entry.listing.id, entry.listing]));
  const uniqueShops = new Set(allTop.map((entry) => entry.listing.shopId));
  const price = averagePrice([...uniqueListings.values()]);
  const avgSearches = mean(keywords.map((k) => k.searches));
  const go = qualified.length >= settings.minQualifiedKeywords;

  const audits = (run.audits ?? [])
    .map(({ keyword, listingId }) => {
      const entry = keywords.find((k) => k.keyword === keyword)?.top.find((t) => t.listing.id === listingId);
      return entry ? auditListing(entry, keyword, settings, now) : null;
    })
    .filter(Boolean);

  const priceText = price ? `${price.value.toFixed(2)} ${price.currency}` : "unknown";
  const summary = go
    ? `This niche has ${qualified.length} qualified keyword${qualified.length === 1 ? "" : "s"} out of ` +
      `${keywords.length} evaluated (you needed at least ${settings.minQualifiedKeywords}). In those keywords, ` +
      `shops with ${fmt(settings.maxShopReviews)} reviews or fewer hold at least ${settings.minBeatableSlots} of ` +
      `the top ${settings.topListings} Etsy results, so a new shop can realistically compete for visibility. ` +
      `The average listing price is ${priceText} and average monthly searches are ${fmt(Math.round(avgSearches ?? 0))}.`
    : `Only ${qualified.length} of ${keywords.length} keywords have at least ${settings.minBeatableSlots} of ` +
      `the top ${settings.topListings} results held by shops with ${fmt(settings.maxShopReviews)} reviews or ` +
      `fewer; you needed ${settings.minQualifiedKeywords}. Established shops dominate these searches.`;

  return {
    ...base,
    verdict: go ? "GO" : "NO-GO",
    reason: go ? "qualified" : "crowded",
    headline: go
      ? `GO — ${qualified.length}/${keywords.length} keywords qualified (need ${settings.minQualifiedKeywords})`
      : `NO-GO — ${qualified.length}/${keywords.length} keywords qualified (need ${settings.minQualifiedKeywords})`,
    summary,
    auditsRun: Boolean(run.audits),
    keywords,
    audits,
    stats: {
      keywordsFound: captured.length,
      usable: usable.length,
      evaluated: keywords.length,
      qualified: qualified.length,
      listings: uniqueListings.size,
      shops: uniqueShops.size,
      avgPrice: price,
      avgSearches: avgSearches === null ? null : Math.round(avgSearches),
      avgCompetition: (() => {
        const value = mean(keywords.map((k) => k.competition));
        return value === null ? null : Math.round(value);
      })(),
    },
  };
}
