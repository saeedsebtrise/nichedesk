import {
  USPTO_SEARCH_URL,
  normalizeTerm,
  parseUsptoResponse,
  usptoQuery,
  type TrademarkMark,
} from "@/features/keywords/trademarks";

/** Phrases sent to the USPTO in one search. */
const CHUNK = 40;
const TIMEOUT_MS = 12_000;
/** Marks change slowly; an answer is reused for a day. */
const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_LIMIT = 20_000;

const cache = new Map<string, { at: number; marks: TrademarkMark[] }>();

export type TrademarkLookup = {
  results: Record<string, TrademarkMark[]>;
  /** Phrases the USPTO did not answer this time; ask again later. */
  failed: string[];
};

/** Exact live USPTO marks for each phrase, cached per server instance. */
export async function lookupTrademarks(terms: string[], fetchImpl: typeof fetch = fetch): Promise<TrademarkLookup> {
  const now = Date.now();
  const results: Record<string, TrademarkMark[]> = {};
  const missing: string[] = [];

  for (const term of new Set(terms.map(normalizeTerm).filter(Boolean))) {
    const hit = cache.get(term);
    if (hit && now - hit.at < CACHE_MS) results[term] = hit.marks;
    else missing.push(term);
  }

  const failed: string[] = [];
  for (let index = 0; index < missing.length; index += CHUNK) {
    const chunk = missing.slice(index, index + CHUNK);
    try {
      const response = await fetchImpl(USPTO_SEARCH_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(usptoQuery(chunk)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`USPTO answered ${response.status}`);
      const parsed = parseUsptoResponse(await response.json(), chunk);
      for (const term of chunk) {
        results[term] = parsed[term] ?? [];
        cache.set(term, { at: now, marks: results[term] });
      }
    } catch {
      failed.push(...chunk);
    }
  }

  // Oldest answers go first once the cache is full.
  for (const key of cache.keys()) {
    if (cache.size <= CACHE_LIMIT) break;
    cache.delete(key);
  }

  return { results, failed };
}
