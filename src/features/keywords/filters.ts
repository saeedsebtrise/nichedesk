import type { Niche } from "../niches/types";
import { withDescendantIds } from "../niches/tree";
import { DEFAULT_VOLUME_RULES, volumeBand, type VolumeBand, type VolumeRules } from "../settings/colors";
import {
  DEFAULT_COMPETITION_RULES,
  competitionBand,
  type CompetitionBand,
  type CompetitionRules,
} from "../settings/competition";
import { detectOccasion, type OccasionId } from "./occasions";
import { opportunityScore, opportunityTier, type OpportunityTier } from "./opportunity";
import type { ImportRow, Keyword, KeywordType, Status, Trend } from "./types";

/** Filters on the unsaved CSV preview. */
export type ImportFilters = {
  including: string;
  excluding: string;
  minVolume: string;
  maxVolume: string;
  minCompetition: string;
  maxCompetition: string;
};

export const EMPTY_IMPORT_FILTERS: ImportFilters = {
  including: "",
  excluding: "",
  minVolume: "",
  maxVolume: "",
  minCompetition: "",
  maxCompetition: "",
};

/** Splits "png, svg" into ["png", "svg"]; terms are matched case-insensitively. */
export function parseTerms(raw: string): string[] {
  return raw
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term !== "");
}

const numberOr = (raw: string, fallback: number): number => {
  const value = Number.parseFloat(raw.replace(/[,\s]/g, ""));
  return Number.isFinite(value) ? value : fallback;
};

type Measurable = { keyword: string; volume: number; competition: number };

function matchesFilters(row: Measurable, filters: ImportFilters): boolean {
  const haystack = row.keyword.toLowerCase();

  const including = parseTerms(filters.including);
  // Any term may match: "including png, svg" means either kind of file.
  if (including.length > 0 && !including.some((term) => haystack.includes(term))) return false;

  const excluding = parseTerms(filters.excluding);
  if (excluding.some((term) => haystack.includes(term))) return false;

  if (row.volume < numberOr(filters.minVolume, -Infinity)) return false;
  if (row.volume > numberOr(filters.maxVolume, Infinity)) return false;
  if (row.competition < numberOr(filters.minCompetition, -Infinity)) return false;
  if (row.competition > numberOr(filters.maxCompetition, Infinity)) return false;

  return true;
}

export function applyImportFilters(rows: ImportRow[], filters: ImportFilters): ImportRow[] {
  return rows.filter((row) => matchesFilters(row, filters));
}

/**
 * The status dropdown, which mixes two independent flags: the pending/done
 * state and the tick. "Ticked only" therefore matches ticked keywords whether
 * they are done or not.
 */
export type StatusFilter = Status | "all" | "ticked";

/** Filters on saved keywords in Upcoming Work. */
export type WorkFilters = {
  search: string;
  /** A parent niche also matches every keyword in its subniches. */
  nicheId: string | "all" | "none";
  status: StatusFilter;
  trend: Trend | "all";
  type: KeywordType | "all";
  minVolume: string;
  maxCompetition: string;
  /** A seasonal occasion, matched from the keyword's own words (see occasions.ts). */
  occasion: OccasionId | "all";
};

export const EMPTY_WORK_FILTERS: WorkFilters = {
  search: "",
  nicheId: "all",
  status: "all",
  trend: "all",
  type: "all",
  minVolume: "",
  maxCompetition: "",
  occasion: "all",
};

export function applyWorkFilters(keywords: Keyword[], filters: WorkFilters, niches: Niche[]): Keyword[] {
  const search = filters.search.trim().toLowerCase();
  const nicheIds =
    filters.nicheId === "all" || filters.nicheId === "none"
      ? null
      : withDescendantIds(niches, filters.nicheId);

  return keywords.filter((keyword) => {
    if (search !== "" && !keyword.keyword.toLowerCase().includes(search)) return false;
    if (filters.nicheId === "none" && keyword.nicheId !== null) return false;
    if (nicheIds && (keyword.nicheId === null || !nicheIds.has(keyword.nicheId))) return false;
    if (filters.status === "ticked" && !keyword.tick) return false;
    if (filters.status !== "all" && filters.status !== "ticked" && keyword.status !== filters.status) {
      return false;
    }
    if (filters.trend !== "all" && keyword.trend !== filters.trend) return false;
    if (filters.type !== "all" && keyword.type !== filters.type) return false;
    if (keyword.volume < numberOr(filters.minVolume, -Infinity)) return false;
    if (keyword.competition > numberOr(filters.maxCompetition, Infinity)) return false;
    if (filters.occasion !== "all" && detectOccasion(keyword.keyword)?.id !== filters.occasion) return false;
    return true;
  });
}

export type SortKey = "keyword" | "volume" | "competition" | "score" | "ip";
export type SortDirection = "asc" | "desc";
export type SortRule = { key: SortKey; direction: SortDirection };

/** Sorting by up to this many columns at once. */
export const MAX_SORT_RULES = 3;

/** The colour cut-offs, which group rows when another sort level follows. */
export type SortBands = {
  competitionRules: CompetitionRules;
  volumeRules: VolumeRules;
  /** COPYRIGHT/IP rank of a keyword (see IP_RANK); results arrive in the background, so it is passed in. */
  ipRank?: (keyword: string) => number;
};

const DEFAULT_BANDS: SortBands = { competitionRules: DEFAULT_COMPETITION_RULES, volumeRules: DEFAULT_VOLUME_RULES };

const VOLUME_RANK: Record<VolumeBand, number> = { low: 0, mid: 1, high: 2 };
const COMPETITION_RANK: Record<CompetitionBand, number> = { green: 0, lightGreen: 1, orange: 2, red: 3 };
const TIER_RANK: Record<OpportunityTier, number> = { tough: 0, fair: 1, good: 2, hot: 3 };

type NumberKey = Exclude<SortKey, "keyword" | "ip">;

const exactValue = (row: Measurable, key: NumberKey) =>
  key === "score" ? opportunityScore(row.volume, row.competition) : row[key];

const groupRank = (row: Measurable, key: NumberKey, bands: SortBands) => {
  if (key === "volume") return VOLUME_RANK[volumeBand(row.volume, bands.volumeRules)];
  if (key === "competition") return COMPETITION_RANK[competitionBand(row.competition, bands.competitionRules)];
  return TIER_RANK[opportunityTier(opportunityScore(row.volume, row.competition))];
};

/**
 * Sorts by several columns at once, e.g. competition high → low, then volume
 * low → high.
 *
 * Volumes and competition counts almost never tie, so a second level sorting
 * on exact numbers would change nothing. Every level but the last therefore
 * sorts by colour group (volume band, competition band, score tier), and the
 * next level orders the rows inside each group. The last level uses exact
 * values. The sort is stable: rows that tie keep their order.
 */
export function sortRows<T extends Measurable>(rows: T[], rules: SortRule[], bands: SortBands = DEFAULT_BANDS): T[] {
  if (rules.length === 0) return [...rows];
  const last = rules.length - 1;

  return [...rows].sort((a, b) => {
    for (const [index, { key, direction }] of rules.entries()) {
      const diff =
        key === "keyword"
          ? a.keyword.localeCompare(b.keyword)
          : key === "ip"
            ? (bands.ipRank?.(a.keyword) ?? 0) - (bands.ipRank?.(b.keyword) ?? 0)
            : index < last
            ? groupRank(a, key, bands) - groupRank(b, key, bands)
            : exactValue(a, key) - exactValue(b, key);
      if (diff !== 0) return direction === "asc" ? diff : -diff;
    }
    return 0;
  });
}

export function sortKeywords(keywords: Keyword[], key: SortKey, direction: SortDirection): Keyword[] {
  return sortRows(keywords, [{ key, direction }]);
}

/** Text sorts A → Z first; numbers high → low. */
export const defaultDirection = (key: SortKey): SortDirection => (key === "keyword" ? "asc" : "desc");

/**
 * The sort after a column header is clicked.
 *
 * A plain click sorts by that column alone, or flips it when it already leads.
 * `add` (Shift+click, or "Then by") flips the column if it is already a level,
 * and otherwise adds it as the next level.
 */
export function toggleSortRule(rules: SortRule[], key: SortKey, add = false): SortRule[] {
  const flip = (rule: SortRule): SortRule => ({ key: rule.key, direction: rule.direction === "asc" ? "desc" : "asc" });
  const existing = rules.findIndex((rule) => rule.key === key);

  if (add) {
    if (existing >= 0) return rules.map((rule, index) => (index === existing ? flip(rule) : rule));
    return [...rules, { key, direction: defaultDirection(key) }].slice(0, MAX_SORT_RULES);
  }
  if (existing === 0) return [flip(rules[0]), ...rules.slice(1)];
  return [{ key, direction: defaultDirection(key) }];
}
