/**
 * Etsy Open API v3 client.
 *
 * Every listing and shop figure in a report comes from Etsy's official API —
 * not from scraping etsy.com pages — so a run never touches the user's Etsy
 * account and cannot trip Etsy's bot protection. Requests are paced under
 * Etsy's per-second limit and a 429 is retried after the delay Etsy asks for.
 */

export class EtsyApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "EtsyApiError";
    this.status = status;
  }
}

const defaultSleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });

const numberOrNull = (value) => (Number.isFinite(value) ? value : null);

/** Only ever link to etsy.com — a report must not carry a foreign URL. */
export function safeEtsyUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /(^|\.)etsy\.com$/.test(parsed.hostname) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function trimListing(raw) {
  return {
    id: raw.listing_id,
    shopId: raw.shop_id,
    title: String(raw.title ?? ""),
    url: safeEtsyUrl(raw.url),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    views: numberOrNull(raw.views),
    favorites: numberOrNull(raw.num_favorers),
    price: raw.price && raw.price.divisor ? raw.price.amount / raw.price.divisor : null,
    currency: raw.price?.currency_code ?? null,
    // Seconds since the epoch; the original date survives renewals.
    createdAt: numberOrNull(raw.original_creation_timestamp ?? raw.creation_timestamp),
    type: raw.listing_type ?? null,
    image: null,
  };
}

export function trimShop(raw) {
  return {
    id: raw.shop_id,
    name: String(raw.shop_name ?? ""),
    url: safeEtsyUrl(raw.url),
    reviewCount: numberOrNull(raw.review_count),
    reviewAverage: numberOrNull(raw.review_average),
    sales: numberOrNull(raw.transaction_sold_count),
    createdAt: numberOrNull(raw.create_date ?? raw.created_timestamp),
    country: raw.shop_location_country_iso ?? raw.shipping_from_country_iso ?? null,
  };
}

export function createEtsyClient({
  apiKey,
  baseUrl,
  fetchImpl = (...args) => fetch(...args),
  minIntervalMs = 150,
  sleep = defaultSleep,
  now = () => Date.now(),
  signal,
}) {
  let nextSlot = 0;
  const shops = new Map();

  async function request(path, params = {}, attempt = 0) {
    if (!apiKey) throw new EtsyApiError("Add your Etsy API key in Settings → Etsy API.", 0);

    const wait = nextSlot - now();
    if (wait > 0) await sleep(wait, signal);
    nextSlot = now() + minIntervalMs;

    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

    let response;
    try {
      response = await fetchImpl(url.href, {
        headers: { "x-api-key": apiKey, accept: "application/json" },
        signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new EtsyApiError("Could not reach the Etsy API — check your internet connection.", 0);
    }

    if (response.status === 429 && attempt < 3) {
      const seconds = Number(response.headers.get("retry-after")) || 2 ** attempt;
      await sleep(seconds * 1000, signal);
      return request(path, params, attempt + 1);
    }
    if (response.status === 401 || response.status === 403) {
      throw new EtsyApiError(
        "Etsy rejected the API key. Check it in Settings → Etsy API (keystring, or keystring:shared_secret).",
        response.status,
      );
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new EtsyApiError(
        `Etsy API error ${response.status}${body.error ? `: ${body.error}` : ""}`,
        response.status,
      );
    }

    return response.json();
  }

  return {
    ping: () => request("/openapi-ping"),

    /** Active listings for a search, in Etsy's relevance order. */
    async searchListings(keywords, limit) {
      const data = await request("/listings/active", {
        keywords,
        limit: Math.min(100, Math.max(1, limit)),
        sort_on: "score",
        sort_order: "desc",
      });
      return { total: data.count ?? 0, listings: (data.results ?? []).map(trimListing) };
    },

    /**
     * Thumbnails and shop records for a set of listings in one call. Returns
     * an empty map instead of failing: pictures are nice to have, and shops
     * are fetched one by one afterwards for anything missing.
     */
    async listingExtras(ids) {
      const extras = new Map();
      if (ids.length === 0) return extras;
      try {
        const data = await request("/listings/batch", {
          listing_ids: ids.join(","),
          includes: "Images,Shop",
        });
        for (const raw of data.results ?? []) {
          const shop = raw.shop && Number.isFinite(raw.shop.review_count) ? trimShop(raw.shop) : null;
          if (shop) shops.set(shop.id, shop);
          extras.set(raw.listing_id, {
            image: raw.images?.[0]?.url_170x135 ?? raw.images?.[0]?.url_75x75 ?? null,
            shop,
          });
        }
      } catch (error) {
        if (error?.name === "AbortError" || error?.status === 401 || error?.status === 403) throw error;
      }
      return extras;
    },

    async getShop(id) {
      if (!shops.has(id)) shops.set(id, trimShop(await request(`/shops/${id}`)));
      return shops.get(id);
    },
  };
}
