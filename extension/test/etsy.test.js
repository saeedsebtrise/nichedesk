import { describe, expect, it, vi } from "vitest";

import { EtsyApiError, createEtsyClient, safeEtsyUrl, trimListing, trimShop } from "../src/lib/etsy.js";

const response = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => headers[name.toLowerCase()] ?? null },
  json: async () => body,
});

const rawListing = (id, overrides = {}) => ({
  listing_id: id,
  shop_id: 77,
  title: "Pet blanket",
  url: `https://www.etsy.com/listing/${id}/pet-blanket`,
  tags: ["pet blanket"],
  views: 10,
  num_favorers: 4,
  price: { amount: 2999, divisor: 100, currency_code: "USD" },
  original_creation_timestamp: 1_700_000_000,
  listing_type: "physical",
  ...overrides,
});

function client(fetchImpl, overrides = {}) {
  return createEtsyClient({
    apiKey: "test-key",
    baseUrl: "https://openapi.etsy.com/v3/application",
    fetchImpl,
    sleep: vi.fn(async () => undefined),
    now: () => 0,
    minIntervalMs: 0,
    ...overrides,
  });
}

describe("searchListings", () => {
  it("asks for active listings by relevance and trims them", async () => {
    const fetchImpl = vi.fn(async () => response(200, { count: 1234, results: [rawListing(1)] }));

    const result = await client(fetchImpl).searchListings("pet blanket", 12);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      "https://openapi.etsy.com/v3/application/listings/active?keywords=pet+blanket&limit=12&sort_on=score&sort_order=desc",
    );
    expect(init.headers["x-api-key"]).toBe("test-key");
    expect(result.total).toBe(1234);
    expect(result.listings[0]).toMatchObject({ id: 1, shopId: 77, price: 29.99, currency: "USD", favorites: 4 });
  });

  it("caps the limit at Etsy's maximum of 100", async () => {
    const fetchImpl = vi.fn(async () => response(200, { count: 0, results: [] }));

    await client(fetchImpl).searchListings("x", 500);

    expect(fetchImpl.mock.calls[0][0]).toContain("limit=100");
  });
});

describe("request handling", () => {
  it("refuses to call Etsy without an API key", async () => {
    await expect(client(vi.fn(), { apiKey: "" }).ping()).rejects.toThrow(EtsyApiError);
  });

  it("explains a rejected API key", async () => {
    const error = await client(vi.fn(async () => response(403, {}))).ping().catch((e) => e);

    expect(error).toBeInstanceOf(EtsyApiError);
    expect(error.status).toBe(403);
    expect(error.message).toMatch(/rejected the API key/);
  });

  it("waits out a 429 for as long as Etsy asks, then retries", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(429, {}, { "retry-after": "3" }))
      .mockResolvedValueOnce(response(200, { application_id: 42 }));

    const result = await client(fetchImpl, { sleep }).ping();

    expect(sleep).toHaveBeenCalledWith(3000, undefined);
    expect(result.application_id).toBe(42);
  });

  it("paces back-to-back requests", async () => {
    let clock = 1000;
    const sleep = vi.fn(async (ms) => {
      clock += ms;
    });
    const fetchImpl = vi.fn(async () => response(200, {}));
    const etsy = client(fetchImpl, { sleep, now: () => clock, minIntervalMs: 150 });

    await etsy.ping();
    await etsy.ping();

    expect(sleep).toHaveBeenCalledWith(150, undefined);
  });

  it("reports a network failure plainly", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(client(fetchImpl).ping()).rejects.toThrow(/Could not reach the Etsy API/);
  });
});

describe("listingExtras", () => {
  it("returns images and shops from one batch call", async () => {
    const fetchImpl = vi.fn(async () =>
      response(200, {
        results: [
          { listing_id: 1, images: [{ url_170x135: "https://i.etsystatic.com/1.jpg" }], shop: { shop_id: 77, shop_name: "Paws", review_count: 12 } },
          { listing_id: 2, images: [] },
        ],
      }),
    );

    const extras = await client(fetchImpl).listingExtras([1, 2]);

    expect(fetchImpl.mock.calls[0][0]).toContain("listing_ids=1%2C2");
    expect(extras.get(1)).toMatchObject({ image: "https://i.etsystatic.com/1.jpg", shop: { id: 77, reviewCount: 12 } });
    expect(extras.get(2)).toEqual({ image: null, shop: null });
  });

  it("degrades to no extras when the batch call fails", async () => {
    const extras = await client(vi.fn(async () => response(500, {}))).listingExtras([1]);

    expect(extras.size).toBe(0);
  });

  it("still fails loudly on a bad API key", async () => {
    await expect(client(vi.fn(async () => response(401, {}))).listingExtras([1])).rejects.toThrow(EtsyApiError);
  });
});

describe("getShop", () => {
  it("caches shops across keywords", async () => {
    const fetchImpl = vi.fn(async () => response(200, { shop_id: 77, shop_name: "Paws", review_count: 12 }));
    const etsy = client(fetchImpl);

    await etsy.getShop(77);
    const shop = await etsy.getShop(77);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(shop).toMatchObject({ id: 77, name: "Paws", reviewCount: 12 });
  });
});

describe("trimming", () => {
  it("keeps only etsy.com links", () => {
    expect(safeEtsyUrl("https://www.etsy.com/listing/1")).toBe("https://www.etsy.com/listing/1");
    expect(safeEtsyUrl("https://etsy.com.evil.example/listing/1")).toBeNull();
    expect(safeEtsyUrl("javascript:alert(1)")).toBeNull();
    expect(trimListing(rawListing(1, { url: "https://evil.example" })).url).toBeNull();
  });

  it("maps shop fields and tolerates missing ones", () => {
    expect(trimShop({ shop_id: 1, shop_name: "A", review_count: 3, review_average: 4.5, transaction_sold_count: 9, shop_location_country_iso: "GB" })).toMatchObject({
      reviewCount: 3,
      reviewAverage: 4.5,
      sales: 9,
      country: "GB",
    });
    expect(trimShop({ shop_id: 1 })).toMatchObject({ reviewCount: null, sales: null, country: null });
  });
});
