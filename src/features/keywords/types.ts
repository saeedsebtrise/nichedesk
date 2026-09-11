export const TRENDS = ["Evergreen", "Seasonal", "Trending"] as const;
export const TYPES = ["White hat", "Grey hat", "Black hat"] as const;
export const STATUSES = ["pending", "done"] as const;

export type Trend = (typeof TRENDS)[number];
export type KeywordType = (typeof TYPES)[number];
export type Status = (typeof STATUSES)[number];

export type Keyword = {
  id: string;
  keyword: string;
  volume: number;
  competition: number;
  nicheId: string | null;
  trend: Trend;
  type: KeywordType;
  status: Status;
  tick: boolean;
  createdAt: string;
};

/** A row parsed from a CSV that has not been saved yet. */
export type ImportRow = {
  /** Stable within one preview only, so rows can be selected and dropped. */
  id: string;
  keyword: string;
  volume: number;
  competition: number;
};
