import { DEFAULT_SETTINGS } from "../src/lib/settings.js";

export const NOW = new Date("2026-09-11T00:00:00.000Z");
export const daysAgo = (days) => Math.floor((NOW.getTime() - days * 86_400_000) / 1000);

export const settings = (overrides = {}) => ({ ...DEFAULT_SETTINGS, minQualifiedKeywords: 2, ...overrides });

export const row = (keyword, searches = 1000, competition = 5000) => ({
  keyword,
  searches,
  competition,
  clicks: null,
  ctr: null,
});

export const listing = (id, shopId, overrides = {}) => ({
  id,
  shopId,
  title: `Personalized pet blanket with name, custom embroidered dog blanket, gift ${id}`,
  url: `https://www.etsy.com/listing/${id}`,
  tags: ["pet blanket", "dog blanket"],
  views: 1000,
  favorites: 60,
  price: 30,
  currency: "USD",
  createdAt: daysAgo(60),
  type: "physical",
  image: null,
  ...overrides,
});

export const shop = (id, reviewCount, overrides = {}) => ({
  id,
  name: `Shop${id}`,
  url: `https://www.etsy.com/shop/Shop${id}`,
  reviewCount,
  reviewAverage: 4.8,
  sales: 500,
  createdAt: daysAgo(400),
  country: "US",
  ...overrides,
});

/** A keyword snapshot whose top listings belong to shops with these review counts. */
export function snapshot(reviewCounts, { total = 5000, idBase = 1, listingOverrides = {} } = {}) {
  const listings = reviewCounts.map((_, index) =>
    listing(idBase + index, 1000 + idBase + index, listingOverrides),
  );
  const shops = Object.fromEntries(
    reviewCounts.map((count, index) => [1000 + idBase + index, shop(1000 + idBase + index, count)]),
  );
  return { total, listings, shops };
}
