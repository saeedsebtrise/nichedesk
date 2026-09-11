/**
 * Automatic subniches: splits the keywords going into a niche into themed
 * subniches, so importing 1,096 "pattern" keywords into Pattern yields
 * Pattern › crochet pattern, Pattern › sewing pattern, and so on.
 *
 * Greedy and deterministic: each round takes the word shared by the most
 * keywords that are still unsorted, makes it a subniche, and removes those
 * keywords from the pool. Because counts are re-taken every round, the
 * biggest theme wins a keyword ("crochet pattern for beginners" goes to
 * crochet, not beginner), and small leftover themes only form from what
 * the big ones did not claim. Keywords that fit no theme stay in the parent.
 *
 * Pure, so the "Add to a niche" preview and the server's actual grouping are
 * the same computation.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "or", "the", "for", "of", "to", "in", "on", "with", "my", "your",
  "by", "at", "from", "is", "it", "this", "that", "as", "you", "i", "me", "we", "our",
]);

/** Format and filler words: they describe how an item is sold, not what it is. */
const FILLER = new Set([
  "digital", "download", "instant", "printable", "pdf", "file", "free", "easy", "simple",
  "diy", "new", "best", "cute",
]);

/** Folds a plural onto its singular: "shirts" → "shirt", but "dress" stays. */
export const stem = (word: string): string =>
  word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export type PlannedSubniche = {
  /** Name the subniche gets, e.g. "crochet pattern". */
  name: string;
  /** The shared (stemmed) word that defines it, e.g. "crochet". */
  term: string;
  /** Indexes into the keyword list passed in. */
  members: number[];
};

export type SubnichePlan = {
  groups: PlannedSubniche[];
  /** Keywords that fit no theme; they stay in the parent niche. */
  rest: number[];
  minGroupSize: number;
};

export type PlanOptions = {
  /** Fewest keywords a theme needs to become a subniche. */
  minGroupSize?: number;
  maxGroups?: number;
};

/** Scales with the batch: 3 for small lists, about 1% of large ones. */
export function defaultMinGroupSize(count: number): number {
  return Math.max(3, Math.round(count / 100));
}

/**
 * "crochet" under "Pattern" → "crochet pattern". A long parent name would
 * make an unwieldy label, so past two words the theme stands alone — the
 * tree already shows it sits under that parent.
 */
export function subnicheName(term: string, parentName: string): string {
  const parent = parentName.trim().toLowerCase();
  if (!parent || parent.split(/\s+/).length > 2) return term;
  return `${term} ${parent}`;
}

export function planSubniches(keywords: string[], parentName: string, options: PlanOptions = {}): SubnichePlan {
  const minGroupSize = Math.max(2, Math.round(options.minGroupSize ?? defaultMinGroupSize(keywords.length)));
  const maxGroups = options.maxGroups ?? 40;
  const parentStems = new Set(words(parentName).map(stem));

  // For each stem, how often each spelling appears — the label uses the commonest.
  const spellings = new Map<string, Map<string, number>>();

  const termsOf = keywords.map((keyword) => {
    const terms = new Set<string>();
    for (const word of words(keyword)) {
      const root = stem(word);
      if (STOPWORDS.has(word) || FILLER.has(word) || FILLER.has(root)) continue;
      if (parentStems.has(root) || /^\d+$/.test(word) || root.length < 2) continue;
      terms.add(root);
      const forms = spellings.get(root) ?? new Map<string, number>();
      forms.set(word, (forms.get(word) ?? 0) + 1);
      spellings.set(root, forms);
    }
    return terms;
  });

  const spelling = (root: string): string => {
    const forms = [...(spellings.get(root) ?? new Map<string, number>())];
    forms.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return forms[0]?.[0] ?? root;
  };

  const unsorted = new Set(keywords.map((_, index) => index));
  const groups: PlannedSubniche[] = [];

  while (groups.length < maxGroups) {
    const counts = new Map<string, number>();
    for (const index of unsorted) {
      for (const term of termsOf[index]) counts.set(term, (counts.get(term) ?? 0) + 1);
    }

    let best: string | null = null;
    let bestCount = 0;
    for (const [term, count] of counts) {
      // Ties go alphabetically so the same input always gives the same tree.
      if (count > bestCount || (count === bestCount && best !== null && term < best)) {
        best = term;
        bestCount = count;
      }
    }
    if (best === null || bestCount < minGroupSize) break;

    const members = [...unsorted].filter((index) => termsOf[index].has(best));
    for (const index of members) unsorted.delete(index);
    groups.push({ name: subnicheName(spelling(best), parentName), term: best, members });
  }

  return { groups, rest: [...unsorted], minGroupSize };
}
