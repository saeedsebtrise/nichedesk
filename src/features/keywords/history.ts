import type { Keyword, Snapshot } from "./types";

/**
 * A keyword's numbers over time. Every import of a keyword that is already
 * saved adds a reading, so re-importing a fresh eRank export each month shows
 * whether a search is growing or getting crowded.
 */

/** Readings kept per keyword — two years of monthly re-imports. */
export const MAX_SNAPSHOTS = 24;

const dayOf = (iso: string) => iso.slice(0, 10);

type Measured = Pick<Keyword, "createdAt" | "volume" | "competition" | "history">;

/** A keyword's readings, oldest first — at least the one it was saved with. */
export function snapshotsOf(keyword: Measured): Snapshot[] {
  if (keyword.history && keyword.history.length > 0) return keyword.history;
  return [{ at: keyword.createdAt, volume: keyword.volume, competition: keyword.competition }];
}

/**
 * Adds a reading. A second reading on the same day replaces the first — an
 * export re-imported an hour later is the same measurement — and only the
 * latest MAX_SNAPSHOTS are kept.
 */
export function recordSnapshot(history: Snapshot[], reading: Snapshot): Snapshot[] {
  const last = history[history.length - 1];
  const next =
    last && dayOf(last.at) === dayOf(reading.at) ? [...history.slice(0, -1), reading] : [...history, reading];
  return next.slice(-MAX_SNAPSHOTS);
}

/** Whole-number percent change; null when starting from zero, where a percentage means nothing. */
export function percentChange(from: number, to: number): number | null {
  if (from === 0) return to === 0 ? 0 : null;
  return Math.round(((to - from) / from) * 100);
}

export type Movement = {
  volume: number | null;
  competition: number | null;
  /** When the reading being compared against was taken. */
  since: string;
};

/** How the latest reading compares with the one before it; null until there are two. */
export function movementOf(keyword: Measured): Movement | null {
  const readings = snapshotsOf(keyword);
  if (readings.length < 2) return null;
  const previous = readings[readings.length - 2];
  const latest = readings[readings.length - 1];
  return {
    volume: percentChange(previous.volume, latest.volume),
    competition: percentChange(previous.competition, latest.competition),
    since: previous.at,
  };
}
