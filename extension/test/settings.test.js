import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings, saveSettings } from "../src/lib/settings.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    get: async (keys) => Object.fromEntries([keys].flat().map((key) => [key, data[key]])),
    set: async (values) => Object.assign(data, values),
  };
}

describe("sanitizeSettings", () => {
  it("starts from the defaults", () => {
    expect(sanitizeSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("rounds, strips separators and clamps numbers", () => {
    const result = sanitizeSettings({ minSearches: "1,500", topListings: 400, maxKeywords: -3, minWords: "2.6" });

    expect(result).toMatchObject({ minSearches: 1500, topListings: 48, maxKeywords: 1, minWords: 3 });
  });

  it("ignores blanks and junk, keeping the default", () => {
    expect(sanitizeSettings({ minSearches: "", maxCompetition: "lots" })).toMatchObject({
      minSearches: DEFAULT_SETTINGS.minSearches,
      maxCompetition: DEFAULT_SETTINGS.maxCompetition,
    });
  });

  it("never asks for more beatable slots than listings are checked", () => {
    expect(sanitizeSettings({ topListings: 5, minBeatableSlots: 9 }).minBeatableSlots).toBe(5);
  });

  it("trims keys and the workspace URL, and only accepts known countries", () => {
    const result = sanitizeSettings({
      licenseKey: "  NDSK-AAAA-BBBB-CCCC ",
      nicheDeskUrl: "https://desk.example.com///",
      erankCountry: "MARS",
    });

    expect(result).toMatchObject({
      licenseKey: "NDSK-AAAA-BBBB-CCCC",
      nicheDeskUrl: "https://desk.example.com",
      erankCountry: "GLO",
    });
  });

  it("drops unknown keys", () => {
    expect(sanitizeSettings({ evil: 1 })).not.toHaveProperty("evil");
  });
});

describe("loadSettings / saveSettings", () => {
  it("merges a partial save over what is stored", async () => {
    const storage = memoryStorage({ settings: { minSearches: 800 } });

    await saveSettings({ maxCompetition: 9000 }, storage);
    const { settings } = await loadSettings(storage);

    expect(settings).toMatchObject({ minSearches: 800, maxCompetition: 9000 });
  });

  it("lets stored endpoint overrides win over the build config", async () => {
    const storage = memoryStorage({ endpoints: { etsyApiBase: "http://localhost:3300/etsy" } });

    const { endpoints } = await loadSettings(storage);

    expect(endpoints.etsyApiBase).toBe("http://localhost:3300/etsy");
    expect(endpoints.erankBaseUrl).toBe("https://members.erank.com");
  });
});
