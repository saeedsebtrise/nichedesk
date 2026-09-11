import type { Niche } from "../niches/types";
import { withDescendantIds } from "../niches/tree";
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
};

export const EMPTY_WORK_FILTERS: WorkFilters = {
  search: "",
  nicheId: "all",
  status: "all",
  trend: "all",
  type: "all",
  minVolume: "",
  maxCompetition: "",
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
    return true;
  });
}

export type SortKey = "keyword" | "volume" | "competition";
export type SortDirection = "asc" | "desc";

export function sortKeywords(keywords: Keyword[], key: SortKey, direction: SortDirection): Keyword[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...keywords].sort((a, b) => {
    if (key === "keyword") return a.keyword.localeCompare(b.keyword) * factor;
    return (a[key] - b[key]) * factor;
  });
}
