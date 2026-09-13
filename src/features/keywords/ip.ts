import { IP_CATALOG, type CatalogEntry } from "./ipCatalog";
import {
  PRODUCT_CLASSES,
  isCommonWord,
  normalizeTerm,
  trademarkTerms,
  type TrademarkMark,
  type TrademarkVerdict,
} from "./trademarks";

/**
 * The COPYRIGHT/IP screen: does a keyword name someone else's character,
 * celebrity, brand or franchise?
 *
 * Three sources, strongest first:
 *   1. A built-in list of well-known Etsy IP, checked instantly.
 *   2. Wikipedia: each phrase is looked up, and its short description
 *      ("Disney cartoon character", "Indian actor (born 1965)") says what it is.
 *      Generic pages ("Edible fruit", "Flexible container") clear a phrase.
 *   3. The USPTO: an invented word with no Wikipedia page but a live trademark
 *      filing on products is flagged as possible.
 *
 * This is automated screening, not a legal determination.
 */

export type IpCategory = "CHARACTER" | "CELEBRITY" | "BRAND" | "FRANCHISE" | "OTHER_IP";

/** "unchecked": nothing in the built-in list, and an online source did not answer. */
export type IpStatus = "yes" | "possible" | "no" | "unchecked";

export type IpSource = "catalog" | "wikipedia" | "uspto";

export type IpResult = {
  status: IpStatus;
  category?: IpCategory;
  /** The words in the keyword that matched. */
  matched?: string;
  /** Who owns it, or what it is — e.g. "Disney" or "Indian actor (born 1965)". */
  detail?: string;
  source?: IpSource;
};

export const IP_DISCLAIMER =
  "Potential Etsy intellectual-property risk. This is an automated screening result, not legal advice.";

export const CATEGORY_LABEL: Record<IpCategory, string> = {
  CHARACTER: "Character",
  CELEBRITY: "Celebrity",
  BRAND: "Brand",
  FRANCHISE: "Franchise",
  OTHER_IP: "Other IP",
};

/** What Wikipedia holds for a phrase: null when it has no page. */
export type WikiFact = {
  title: string;
  description: string;
  disambiguation: boolean;
  /** False when the phrase only redirects to a page about something else ("mama bear" → Goldilocks). */
  exact: boolean;
} | null;

/** An answer that may still be on its way, or may have failed. */
export type Lookup<T> = { state: "done"; value: T } | { state: "pending" } | { state: "failed" };

// --- 1. The built-in list -------------------------------------------------

type IndexedName = { words: string[]; entry: CatalogEntry };

const INDEX = (() => {
  const index = new Map<string, IndexedName[]>();
  for (const entry of IP_CATALOG) {
    for (const name of entry.names) {
      const words = normalizeTerm(name).split(" ").filter(Boolean);
      if (words.length === 0) continue;
      const bucket = index.get(words[0]) ?? [];
      bucket.push({ words, entry });
      index.set(words[0], bucket);
    }
  }
  return index;
})();

/** "mickeys" still matches "mickey" at the end of a name. */
const sameWord = (actual: string | undefined, expected: string, last: boolean) =>
  actual === expected || (last && actual === `${expected}s`);

const contains = (text: string, phrase: string) => ` ${text} `.includes(` ${normalizeTerm(phrase)} `);

const rank = (result: IpResult | null | undefined) =>
  !result ? 0 : result.status === "yes" ? 3 : result.status === "possible" ? 2 : 1;

/** The strongest built-in match in a keyword, or null. */
export function catalogMatch(keyword: string): IpResult | null {
  const text = normalizeTerm(keyword);
  const words = text.split(" ");
  let best: IpResult | null = null;
  let bestLength = 0;

  for (let start = 0; start < words.length; start += 1) {
    const bucket = INDEX.get(words[start]) ?? INDEX.get(words[start].replace(/s$/, "")) ?? [];
    for (const { words: name, entry } of bucket) {
      const fits = name.every((word, offset) =>
        offset === 0
          ? sameWord(words[start], word, name.length === 1)
          : sameWord(words[start + offset], word, offset === name.length - 1),
      );
      if (!fits) continue;

      let status: IpStatus = entry.level;
      if (entry.context) {
        if (entry.context.generic?.some((phrase) => contains(text, phrase))) continue;
        const rest = [...words.slice(0, start), ...words.slice(start + name.length)].join(" ");
        if (entry.context.requires.some((phrase) => contains(rest, phrase))) status = "yes";
      }

      const result: IpResult = {
        status,
        category: entry.category,
        matched: name.join(" "),
        // Group entries ("Various companies") name no single owner, so say nothing rather than something vague.
        detail: entry.owner.startsWith("Various") ? undefined : entry.owner,
        source: "catalog",
      };
      if (rank(result) > rank(best) || (rank(result) === rank(best) && name.length > bestLength)) {
        best = result;
        bestLength = name.length;
      }
    }
  }
  return best;
}

// --- 2. Wikipedia descriptions ---------------------------------------------

const NOT_A_NAME = /topics referred to|name list|given name|surname|family name|disambiguation/;
const GENERIC =
  /legendary|mythical|mytholog|folk ?tale|fairy tale|nursery rhyme|species|breed of|genus|edible|fruit|flowering plant|cultivar|\bdish\b|spice|celebration|holiday|festival|observance|technique|national park|river in|constellation|star system|planet|religious|deity|goddess|\bgod\b|archetype|cultural phenomenon|magic phrase|idiom|slang|\b(?:tint|shade) of\b|^colou?r\b|trophy|container|sports competition|recipe|hairstyle|garment|fabric|textile/;
const OCCUPATION =
  /\b(?:actor|actress|singer|songwriter|rapper|musician|footballer|cricketer|(?:basketball|football|baseball|soccer|hockey|tennis|volleyball) player|golfer|gymnast|athlete|wrestler|boxer|youtuber|influencer|comedian|(?:television|tv) (?:host|personality)|presenter|media personality|model|dj|record producer|film producer|filmmaker|entrepreneur|businessman|businesswoman|politician|president|painter|artist|designer|poet|author|writer|chef)\b/;
const MUSIC_GROUP = /\b(?:band|boy band|girl group|duo|musical group|pop group|k-pop group)\b/;
const CHARACTER = /\b(?:character|characters|superhero|supervillain|villain|muppet|mascot)\b/;
const FRANCHISE = /\b(?:franchise|film series|book series|novel series|novels|manga|anime|comic strip|comic book|comics|character series)\b/;
const BRAND =
  /\b(?:company|brand|manufacturer|corporation|conglomerate|retailer|fashion house|chain|restaurant|toy|toys|doll|platform|studio|streaming service|social media|soft drink|beer|whiskey|whisky|vodka|liquor|clothing|apparel|footwear|cosmetics|record label)\b/;
const WORK =
  /\b(?:film|movie|television series|tv series|television show|tv show|sitcom|animated series|web series|youtube channel|video game|game series|concert tour|musical|podcast|reality show|sports team|team|football club|club|league)\b/;
const LOOSE = /\b(?:internet meme|meme|fandom|fan base|fanbase)\b/;

/** What a Wikipedia short description says a page is about, if it is IP at all. */
export function classifyDescription(description: string): { category: IpCategory; status: "yes" | "possible" } | null {
  const text = description.toLowerCase().trim();
  if (text === "" || NOT_A_NAME.test(text) || GENERIC.test(text)) return null;

  if (MUSIC_GROUP.test(text)) return { category: "CELEBRITY", status: "yes" };
  if (OCCUPATION.test(text)) {
    if (/\(\s*born\b/.test(text)) return { category: "CELEBRITY", status: "yes" };
    const died = text.match(/\b\d{3,4}\s*[–-]\s*(\d{4})\s*\)/);
    if (died) return Number(died[1]) >= 1970 ? { category: "CELEBRITY", status: "possible" } : null;
    return { category: "CELEBRITY", status: "possible" };
  }
  if (CHARACTER.test(text)) return { category: "CHARACTER", status: "yes" };
  if (FRANCHISE.test(text)) return { category: "FRANCHISE", status: "yes" };
  if (BRAND.test(text)) return { category: "BRAND", status: "yes" };
  if (WORK.test(text)) return { category: "OTHER_IP", status: "yes" };
  if (LOOSE.test(text)) return { category: "OTHER_IP", status: "possible" };
  return null;
}

/** A Wikipedia page's verdict for one phrase: single everyday words and titles of works only reach POSSIBLE. */
export function wikiVerdict(term: string, fact: WikiFact): IpResult | null {
  if (!fact || !fact.exact || fact.disambiguation) return null;
  const found = classifyDescription(fact.description);
  if (!found) return null;

  const single = !term.includes(" ");
  const weak = single && (isCommonWord(term) || found.category === "OTHER_IP");
  return {
    status: weak ? "possible" : found.status,
    category: found.category,
    matched: term,
    detail: fact.description,
    source: "wikipedia",
  };
}

// --- 3. USPTO filings for invented words -----------------------------------

const onProducts = (mark: TrademarkMark) => mark.classes.some((code) => code in PRODUCT_CLASSES);

/** An invented word (no Wikipedia page) with a live trademark on products is possible IP. */
export function usptoVerdict(term: string, marks: TrademarkMark[]): IpResult | null {
  const mark = marks.find(onProducts);
  if (!mark || term.includes(" ")) return null;
  return {
    status: "possible",
    category: "OTHER_IP",
    matched: term,
    detail: `${mark.registered ? "Registered trademark" : "Trademark application"}${mark.owner ? ` · ${mark.owner}` : ""}`,
    source: "uspto",
  };
}

// --- Putting it together ----------------------------------------------------

export type IpLookups = {
  wiki: (term: string) => Lookup<WikiFact>;
  uspto: (term: string) => Lookup<TrademarkMark[]>;
};

/** Phrases to look up online for a keyword (the same brand-like phrases the trademark check uses). */
export const ipTerms = (keyword: string) => trademarkTerms(keyword);

/** Which phrases need a USPTO answer before a keyword's result is final. */
export function usptoTermsNeeded(keyword: string, wiki: IpLookups["wiki"]): string[] {
  return ipTerms(keyword).filter((term) => {
    if (term.includes(" ")) return false;
    const fact = wiki(term);
    return fact.state === "done" && fact.value === null;
  });
}

/**
 * The keyword's COPYRIGHT/IP result, or undefined while it is still being
 * checked. A YES from the built-in list needs no lookups at all.
 */
export function ipResult(keyword: string, lookups: IpLookups): IpResult | undefined {
  const listed = catalogMatch(keyword);
  if (listed?.status === "yes") return listed;

  let best: IpResult | null = listed;
  let pending = false;
  let failed = false;

  for (const term of ipTerms(keyword)) {
    // The built-in list already judged this name (e.g. "cricut" is only possible); online sources do not overrule it.
    if (listed?.matched && contains(listed.matched, term)) continue;
    const fact = lookups.wiki(term);
    let found: IpResult | null = null;
    if (fact.state === "pending") pending = true;
    else if (fact.state === "failed") failed = true;
    else if (fact.value === null && !term.includes(" ")) {
      const marks = lookups.uspto(term);
      if (marks.state === "pending") pending = true;
      else if (marks.state === "failed") failed = true;
      else found = usptoVerdict(term, marks.value);
    } else found = wikiVerdict(term, fact.value);

    if (found && rank(found) > rank(best)) best = found;
  }

  if (best?.status === "yes") return best;
  if (pending) return best ?? undefined;
  if (best) return best;
  return { status: failed ? "unchecked" : "no" };
}

/** Sort order for the column: YES first when sorting high → low. */
export const IP_RANK: Record<IpStatus, number> = { unchecked: 0, no: 1, possible: 2, yes: 3 };

/** The USPTO marks behind a YES or POSSIBLE, shown as the Trademark badge. */
export function trademarkBehind(result: IpResult | undefined, uspto: IpLookups["uspto"]): TrademarkVerdict | null {
  if (!result?.matched || (result.status !== "yes" && result.status !== "possible")) return null;
  const marks = uspto(result.matched);
  if (marks.state !== "done" || marks.value.length === 0) return null;
  const registered = marks.value.some((mark) => mark.registered && onProducts(mark));
  return { term: result.matched, level: registered ? "registered" : "possible", marks: marks.value };
}
