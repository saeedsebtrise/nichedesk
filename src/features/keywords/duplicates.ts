import { stem } from "../niches/auto-group";
import type { Keyword } from "./types";

/** Joining words that change nothing about what a buyer is searching for. */
const STOPWORDS = new Set(["a", "an", "and", "the", "for", "of", "to", "in", "on", "with", "my", "your"]);

/**
 * What a keyword says regardless of word order, plurals, punctuation and small
 * joining words: "Christmas PNGs", "png christmas" and "christmas-png" all
 * come out the same. The result is only ever compared, never shown.
 */
export function duplicateSignature(keyword: string): string {
  const words = keyword
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== "" && !STOPWORDS.has(word))
    .map(stem);
  return [...new Set(words)].sort().join(" ");
}

export type DuplicateGroup = {
  signature: string;
  /** The copy worth keeping first. */
  keywords: Keyword[];
};

/** Most searched first, then least contested, then the oldest. */
const bestFirst = (a: Keyword, b: Keyword) =>
  b.volume - a.volume || a.competition - b.competition || a.createdAt.localeCompare(b.createdAt);

/** Every set of two or more keywords with the same signature, biggest sets first. */
export function findDuplicates(keywords: Keyword[]): DuplicateGroup[] {
  const groups = new Map<string, Keyword[]>();
  for (const keyword of keywords) {
    const signature = duplicateSignature(keyword.keyword);
    if (signature === "") continue;
    const group = groups.get(signature);
    if (group) group.push(keyword);
    else groups.set(signature, [keyword]);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([signature, group]) => ({ signature, keywords: [...group].sort(bestFirst) }))
    .sort((a, b) => b.keywords.length - a.keywords.length || a.signature.localeCompare(b.signature));
}
