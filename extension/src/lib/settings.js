import { CONFIG } from "../config.js";

/** What a fresh install starts with — the same defaults as the settings screen. */
export const DEFAULT_SETTINGS = Object.freeze({
  licenseKey: "",
  etsyApiKey: CONFIG.defaultEtsyApiKey,
  erankCountry: "GLO",

  // Step 1 — eRank filters
  minSearches: 500,
  maxCompetition: 25000,
  minWords: 1,
  maxKeywords: 20,
  requireSeedWord: false,

  // Steps 2–4 — niche qualification
  topListings: 12,
  maxShopReviews: 300,
  minBeatableSlots: 3,
  minQualifiedKeywords: 5,
  maxAudits: 10,

  nicheDeskUrl: "http://localhost:3000",
  /** Only needed when the NicheDesk server has APP_PASSWORD set. */
  nicheDeskPassword: "",
});

/** [min, max] for every numeric setting, so a typo cannot stall a run. */
const LIMITS = {
  minSearches: [0, 10_000_000],
  maxCompetition: [0, 1_000_000_000],
  minWords: [1, 10],
  maxKeywords: [1, 100],
  topListings: [1, 48],
  maxShopReviews: [0, 10_000_000],
  minBeatableSlots: [0, 48],
  minQualifiedKeywords: [1, 100],
  maxAudits: [0, 100],
};

const COUNTRIES = ["GLO", "USA", "GBR", "CAN", "AUS", "DEU", "FRA"];

/**
 * Coerces whatever the popup form or storage holds into valid settings:
 * numbers are rounded and clamped, strings trimmed, unknown keys dropped.
 */
export function sanitizeSettings(input = {}) {
  const out = { ...DEFAULT_SETTINGS };

  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (input[key] === undefined || input[key] === "") continue;
    const value = Math.round(Number(String(input[key]).replace(/[,\s]/g, "")));
    if (Number.isFinite(value)) out[key] = Math.min(max, Math.max(min, value));
  }

  for (const key of ["licenseKey", "etsyApiKey", "nicheDeskPassword"]) {
    if (typeof input[key] === "string") out[key] = input[key].trim();
  }

  if (typeof input.nicheDeskUrl === "string") {
    out.nicheDeskUrl = input.nicheDeskUrl.trim().replace(/\/+$/, "");
  }
  if (COUNTRIES.includes(input.erankCountry)) out.erankCountry = input.erankCountry;
  if (typeof input.requireSeedWord === "boolean") out.requireSeedWord = input.requireSeedWord;

  // Needing more beatable slots than listings are checked could never pass.
  out.minBeatableSlots = Math.min(out.minBeatableSlots, out.topListings);

  return out;
}

export const COUNTRY_OPTIONS = COUNTRIES;

/**
 * Endpoints the popup never shows. Tests and self-hosters override them by
 * writing `endpoints` to storage; everyone else gets CONFIG.
 */
export const DEFAULT_ENDPOINTS = Object.freeze({
  licenseServerUrl: CONFIG.licenseServerUrl,
  erankBaseUrl: CONFIG.erankBaseUrl,
  etsyApiBase: CONFIG.etsyApiBase,
});

export async function loadSettings(storage = chrome.storage.local) {
  const { settings, endpoints } = await storage.get(["settings", "endpoints"]);
  return {
    settings: sanitizeSettings(settings),
    endpoints: { ...DEFAULT_ENDPOINTS, ...(endpoints ?? {}) },
  };
}

export async function saveSettings(patch, storage = chrome.storage.local) {
  const { settings } = await storage.get("settings");
  const next = sanitizeSettings({ ...(settings ?? {}), ...patch });
  await storage.set({ settings: next });
  return next;
}
