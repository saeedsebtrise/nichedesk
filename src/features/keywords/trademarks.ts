/**
 * A first trademark check for keywords, against live marks in the USPTO
 * trademark search (tmsearch.uspto.gov).
 *
 * A keyword is split into the words that could be a brand — "stranger things
 * christmas png" leaves "stranger things" — and each phrase is looked up. Only a
 * live mark whose words are exactly that phrase counts, so "SNOOPY'S PIZZA"
 * does not flag "snoopy". It is a warning to look closer, not legal advice.
 */

export type TrademarkMark = {
  /** USPTO serial number. */
  serial: string;
  wordmark: string;
  owner: string;
  registered: boolean;
  status: string;
  /** International classes, e.g. "025" for clothing. */
  classes: string[];
};

/** "registered": a registered mark covering products Etsy sellers make. "possible": a pending application, or other goods. */
export type TrademarkLevel = "registered" | "possible";

export type TrademarkVerdict = { term: string; level: TrademarkLevel; marks: TrademarkMark[] };

export const USPTO_SEARCH_URL = "https://tmsearch.uspto.gov/prod-v1-0-0/tmsearch";

/** A page anyone can open to look a mark up by its serial number. */
export const usptoCaseUrl = (serial: string) =>
  `https://tsdr.uspto.gov/#caseNumber=${encodeURIComponent(serial)}&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch`;

/** Classes covering what Etsy sellers make, with a short name for each. */
export const PRODUCT_CLASSES: Record<string, string> = {
  "003": "Soap & cosmetics",
  "004": "Candles",
  "009": "Digital files",
  "014": "Jewelry",
  "016": "Paper & stickers",
  "018": "Bags",
  "020": "Home decor",
  "021": "Mugs & kitchen",
  "024": "Blankets & fabric",
  "025": "Clothing",
  "026": "Patches & hair",
  "027": "Rugs & wall",
  "028": "Toys & ornaments",
};

const words = (list: string) => new Set(list.trim().split(/\s+/));

/** Product, style, audience and holiday words: a brand phrase stops at these. */
const FILLER = words(`
  png pngs svg svgs jpg jpeg pdf dxf eps psd file files digital download downloads instant printable printables print
  prints clipart sublimation design designs graphic graphics vector shirt shirts tshirt tshirts tee tees sweatshirt
  sweatshirts hoodie hoodies crewneck tank tumbler tumblers wrap wraps mug mugs sticker stickers decal decals bundle
  bundles poster posters invitation invitations template templates cut cuts laser engraved ornament ornaments keychain
  keychains earrings necklace bracelet jewelry blanket pillow tote apparel outfit onesie bodysuit toddler baby babies
  kid kids youth adult women womens woman men mens man unisex girl girls boy boys mom moms mama mommy dad dads daddy
  papa grandma nana grandpa family matching teacher teachers nurse nurses gift gifts idea ideas personalized custom
  name monogram cute funny sarcastic retro vintage boho groovy aesthetic trendy trending coquette western cowgirl cowboy
  floral watercolor distressed minimalist rustic farmhouse kawaii preppy glitter faux leopard checkered halloween
  christmas xmas thanksgiving friendsgiving easter valentine valentines galentine spooky fall autumn winter summer
  spring holiday holidays season seasonal birthday bday party wedding bride bridal bachelorette anniversary graduation
  grad school day night july patriotic nye mothers fathers mother father layered editable canva etsy set pack
`);

/** Function words: a phrase may hold them, but not start or end with one. */
const STOP = words("a an and the of for with in on to my your our at by from or is it this that as be so");

/** Everyday words that are only checked inside a longer phrase — alone, a mark on "LOVE" says nothing. */
const COMMON = words(`
  about after again all always am any are around away back bad beach bear because been before being best better big
  bird black blessed blue boss bread brother but call can car care cat cats chicken child city class club coffee cold
  come cool country cow crazy cross dance dark dead dear deer do dog dogs doll dont door down dragon dream dreams drink
  duck each earth easy eat egg even ever every eye face faith farm fast fish flag flower flowers fly food forest forever
  free friend friends frog fruit fun game garden get ghost girl give go god gold golf good grace great green grow hair
  half hand happy hard have he head heart hearts hello help her here hero high him his home honey hope horse hot house
  how hunting ice if its jesus just keep kind king kiss lady lake last later lazy leaf let life light like lion little
  live long look lord love lover lucky make many me mermaid might mind mine miss money monster moon more morning most
  mountain mouse much music nature never new nice no not now off oh old one only orange out over own pattern peace people
  pet pink plant play please power pretty proud purple queen rain rainbow read real red rest rock rose run sad safe say
  sea see she sheep shine side simple sky sleep small smile snake soccer some soul space star stars stay still stop
  stranger strong sun sunflower sunset sweet take tea team than thank their them then there these they thing things
  time too tree trees true truck try up us very wait walk want warm water way we wear well what when where white who why
  wild will wine wolf word work world yellow yes yet you young yours zero two three four five six seven eight nine ten
  first second number letter alphabet animal animals wildflower butterfly bee bees unicorn dinosaur dino shark whale owl
  fox bunny rabbit kitten puppy pig goat chick hen rooster elephant giraffe monkey panda tiger zebra llama sloth turtle
  otter axolotl highland camper camping hiking travel adventure ocean waves wave mountains desert cactus plants
  succulent mushroom cherry lemon strawberry apple banana peach pineapple avocado taco pizza donut cookie cookies candy
  chocolate beer whiskey cocktail tequila margarita bar kitchen bathroom bedroom nursery wall art decor sign quote quotes
  saying sayings verse bible christian pray prayer church angel angels skull skeleton witch witches vampire zombie
  pumpkin pumpkins leaves harvest turkey snow snowman snowflake reindeer gnome gnomes elf santa sleigh bells football
  baseball basketball softball volleyball hockey tennis cheer ballet gymnastics wrestling swim bowling fishing runner
  running yoga gym fitness workout lift coach player fan fans sports mascot teams vibes vibe crew squad gang tribe
  besties bestie sister sisters brothers aunt auntie uncle cousin husband wife wifey hubby boyfriend girlfriend mr mrs
  ladies gentleman prince princess pirate ranch rodeo horses southern texas florida california tennessee nashville
  vegas paris london italy mexico usa america american eagle freedom liberty veteran army navy military police fire
  firefighter doctor dentist lawyer chef baker farmer mechanic trucker engineer student senior junior staff office
  employee worker laugh loved lovely lovers kindness positive mental health anxiety awareness cancer ribbon survivor
  warrior strength brave courage fearless spirit joy grateful thankful hustle grind hippie vibes disco babe sugar spice
  salt pepper sour spicy chill sleepy tired mood moody sassy classy bougie fancy fresh clean dirty messy bun nails lashes
  makeup beauty glam gator alligator goose cozy season spice sweater weather cup tour boo shamrock haunted pride sunshine
  hunt gingerbread nutcracker candy cane pole north magic magical merry bright jolly holly noel cheers goth gothic emo
  punk boots daisy lily tulip lavender sage olive mint coral cream beige neutral pastel sparkle shiny silver brown grey
  gray teal
`);

/** Holiday and season phrases every shop uses: a mark on one is not a useful warning. */
const GENERIC_PHRASES = new Set([
  "pumpkin spice",
  "sweater weather",
  "cozy season",
  "spooky season",
  "trick or treat",
  "candy cane",
  "ugly sweater",
  "north pole",
  "back to school",
  "first day of school",
  "mardi gras",
  "fat tuesday",
  "egg hunt",
  "pool party",
  "snow day",
  "be mine",
  "he is risen",
  "jack o lantern",
  "merry christmas",
  "happy new year",
  "new year",
  "fourth of july",
  "independence day",
  "pride month",
]);

/** An everyday word, or its plural ("friends"): too common to be a name on its own. */
export const isCommonWord = (word: string) =>
  COMMON.has(word) || FILLER.has(word) || (word.endsWith("s") && (COMMON.has(word.slice(0, -1)) || FILLER.has(word.slice(0, -1))));

/** Longest brand phrase checked, in words. */
const MAX_WORDS = 4;
/** Phrases looked up per keyword, longest first. */
const MAX_TERMS = 6;

/** Lowercase words only, accents dropped: "Mickey's T-Shirt" → "mickeys t shirt", "Pokémon" → "pokemon". */
export const normalizeTerm = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The phrases in a keyword that could be a brand, longest first. */
export function trademarkTerms(keyword: string): string[] {
  const segments: string[][] = [[]];
  for (const word of normalizeTerm(keyword).split(" ")) {
    const breaks = word.length <= 1 || /^\d+$/.test(word) || FILLER.has(word);
    if (breaks) segments.push([]);
    else segments[segments.length - 1].push(word);
  }

  const terms = new Set<string>();
  for (const segment of segments) {
    for (let size = Math.min(MAX_WORDS, segment.length); size >= 1; size -= 1) {
      for (let start = 0; start + size <= segment.length; start += 1) {
        const gram = segment.slice(start, start + size);
        if (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1])) continue;
        if (size === 1 && (isCommonWord(gram[0]) || gram[0].length < 3)) continue;
        const phrase = gram.join(" ");
        if (!GENERIC_PHRASES.has(phrase)) terms.add(phrase);
      }
    }
  }
  return [...terms].sort((a, b) => b.split(" ").length - a.split(" ").length).slice(0, MAX_TERMS);
}

const clause = (term: string) => ({ match_phrase: { WM: term } });

/**
 * One search for many phrases: a bucket of live marks per phrase. The scored
 * query ranks the shortest matching wordmarks first inside each bucket, so an
 * exact mark is among the top hits.
 */
export function usptoQuery(terms: string[]) {
  return {
    size: 0,
    query: { bool: { should: terms.map(clause), minimum_should_match: 1, filter: [{ term: { alive: true } }] } },
    aggs: {
      terms: {
        filters: { filters: Object.fromEntries(terms.map((term) => [term, clause(term)])) },
        aggs: {
          top: {
            top_hits: {
              size: 8,
              _source: ["wordmark", "alive", "registered", "statusDescription", "ownerName", "internationalClass"],
            },
          },
        },
      },
    },
  };
}

type UsptoHit = {
  _id?: string;
  _source?: {
    wordmark?: string | null;
    alive?: boolean;
    registered?: boolean;
    statusDescription?: string | null;
    ownerName?: string[] | null;
    internationalClass?: string[] | null;
  };
};

/** Exact live marks per phrase. Throws when the answer is not a search result. */
export function parseUsptoResponse(json: unknown, terms: string[]): Record<string, TrademarkMark[]> {
  const buckets = (json as { aggregations?: { terms?: { buckets?: Record<string, { top?: { hits?: { hits?: UsptoHit[] } } }> } } })
    ?.aggregations?.terms?.buckets;
  if (!buckets || typeof buckets !== "object") throw new Error("The USPTO search sent an unexpected answer.");

  return Object.fromEntries(
    terms.map((term) => {
      const seen = new Set<string>();
      const marks: TrademarkMark[] = [];
      for (const hit of buckets[term]?.top?.hits?.hits ?? []) {
        const source = hit._source;
        const serial = String(hit._id ?? "");
        if (!source?.wordmark || source.alive === false || normalizeTerm(source.wordmark) !== term || seen.has(serial)) continue;
        seen.add(serial);
        marks.push({
          serial,
          wordmark: source.wordmark,
          owner: (source.ownerName?.[0] ?? "").replace(/\s*\(.*$/, ""),
          registered: Boolean(source.registered),
          status: source.statusDescription ?? "",
          classes: (source.internationalClass ?? []).map((code) => code.replace(/\D/g, "")).filter(Boolean),
        });
      }
      return [term, marks];
    }),
  );
}

const coversProducts = (mark: TrademarkMark) => mark.registered && mark.classes.some((code) => code in PRODUCT_CLASSES);

/**
 * What the lookups say about one keyword: a verdict when a phrase matched a
 * live mark, null when it is clear, undefined while phrases are still unchecked.
 */
export function trademarkVerdict(
  keyword: string,
  lookup: (term: string) => TrademarkMark[] | undefined,
): TrademarkVerdict | null | undefined {
  let pending = false;
  let best: TrademarkVerdict | null = null;

  for (const term of trademarkTerms(keyword)) {
    const marks = lookup(term);
    if (marks === undefined) {
      pending = true;
      continue;
    }
    if (marks.length === 0) continue;
    const verdict: TrademarkVerdict = { term, level: marks.some(coversProducts) ? "registered" : "possible", marks };
    // Terms come longest first, so only a stronger level replaces the first match.
    if (!best || (best.level === "possible" && verdict.level === "registered")) best = verdict;
  }

  if (best) return best;
  return pending ? undefined : null;
}
