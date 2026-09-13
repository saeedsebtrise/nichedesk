import type { WikiFact } from "@/features/keywords/ip";
import { normalizeTerm } from "@/features/keywords/trademarks";

/**
 * What English Wikipedia says each phrase is: its page title, short
 * description and whether it is a disambiguation page. Used to tell IP
 * ("Disney cartoon character") from everyday things ("Edible fruit").
 */
const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "NicheDesk/1.0 (https://nichedesk-rho.vercel.app; keyword IP screening)";
/** Wikipedia's limit for titles in one query. */
const TITLES_PER_REQUEST = 50;
const TIMEOUT_MS = 12_000;
const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_LIMIT = 20_000;

const cache = new Map<string, { at: number; fact: WikiFact }>();

export type WikiLookup = {
  results: Record<string, WikiFact>;
  /** Phrases Wikipedia did not answer this time. */
  failed: string[];
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Titles are case-sensitive after the first letter, so try "Mickey mouse", "Mickey Mouse" and, for short words, "BTS". */
export function titleVariants(term: string): string[] {
  const variants = [capitalize(term), term.replace(/\b\w/g, (letter) => letter.toUpperCase())];
  if (!term.includes(" ") && term.length <= 4) variants.push(term.toUpperCase());
  return [...new Set(variants)];
}

/** Whether a page title is about the phrase: "The Walt Disney Company" covers "disney"; "Goldilocks and the Three Bears" does not cover "mama bear". */
export function titleCovers(title: string, term: string): boolean {
  const titleWords = normalizeTerm(title.replace(/\(.*?\)/g, " ")).split(" ").filter(Boolean);
  const termWords = normalizeTerm(term).split(" ").filter(Boolean);
  if (titleWords.join("") === termWords.join("")) return true;
  return termWords.every((word) =>
    titleWords.some((titleWord) => titleWord === word || titleWord === `${word}s` || word === `${titleWord}s`),
  );
}

type Page = { title: string; missing?: boolean; invalid?: boolean; description?: string; pageprops?: Record<string, string> };
type QueryResponse = {
  query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages?: Page[] };
};

/** The best page among a phrase's title variants: an exact page beats a disambiguation page, which beats a redirect elsewhere. */
function pick(term: string, pages: Page[]): WikiFact {
  const facts = pages
    .filter((page) => !page.missing && !page.invalid)
    .map((page) => ({
      title: page.title,
      description: page.description ?? "",
      disambiguation: page.pageprops ? "disambiguation" in page.pageprops : false,
      exact: titleCovers(page.title, term),
    }));
  const score = (fact: NonNullable<WikiFact>) => (fact.exact ? 2 : 0) + (fact.disambiguation ? 0 : 1);
  return facts.sort((a, b) => score(b) - score(a))[0] ?? null;
}

async function queryTitles(titles: string[], fetchImpl: typeof fetch): Promise<Map<string, Page>> {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "pageprops|description",
    ppprop: "disambiguation",
    titles: titles.join("|"),
  }).toString();

  const response = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Wikipedia answered ${response.status}`);
  const json = (await response.json()) as QueryResponse;
  if (!json.query) throw new Error("Wikipedia sent an unexpected answer.");

  const normalized = new Map((json.query.normalized ?? []).map((entry) => [entry.from, entry.to]));
  const redirects = new Map((json.query.redirects ?? []).map((entry) => [entry.from, entry.to]));
  const pages = new Map((json.query.pages ?? []).map((page) => [page.title, page]));

  const byAskedTitle = new Map<string, Page>();
  for (const title of titles) {
    const clean = normalized.get(title) ?? title;
    const page = pages.get(redirects.get(clean) ?? clean);
    if (page) byAskedTitle.set(title, page);
  }
  return byAskedTitle;
}

/** Wikipedia facts for each phrase, cached per server instance. */
export async function lookupWikipedia(terms: string[], fetchImpl: typeof fetch = fetch): Promise<WikiLookup> {
  const now = Date.now();
  const results: Record<string, WikiFact> = {};
  const missing: string[] = [];

  for (const term of new Set(terms.map(normalizeTerm).filter(Boolean))) {
    const hit = cache.get(term);
    if (hit && now - hit.at < CACHE_MS) results[term] = hit.fact;
    else missing.push(term);
  }

  // Group phrases so each request stays within Wikipedia's title limit.
  const groups: string[][] = [];
  let group: string[] = [];
  let size = 0;
  for (const term of missing) {
    const count = titleVariants(term).length;
    if (size + count > TITLES_PER_REQUEST) {
      groups.push(group);
      group = [];
      size = 0;
    }
    group.push(term);
    size += count;
  }
  if (group.length > 0) groups.push(group);

  const failed: string[] = [];
  for (const chunk of groups) {
    try {
      const pages = await queryTitles(chunk.flatMap(titleVariants), fetchImpl);
      for (const term of chunk) {
        const found = titleVariants(term)
          .map((title) => pages.get(title))
          .filter((page): page is Page => Boolean(page));
        results[term] = pick(term, found);
        cache.set(term, { at: now, fact: results[term] });
      }
    } catch {
      failed.push(...chunk);
    }
  }

  for (const key of cache.keys()) {
    if (cache.size <= CACHE_LIMIT) break;
    cache.delete(key);
  }

  return { results, failed };
}
