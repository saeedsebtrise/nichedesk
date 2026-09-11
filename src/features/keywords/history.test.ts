import { describe, expect, it } from "vitest";

import { MAX_SNAPSHOTS, movementOf, percentChange, recordSnapshot, snapshotsOf } from "./history";

const reading = (day: string, volume: number, competition: number) => ({
  at: `${day}T09:00:00.000Z`,
  volume,
  competition,
});

describe("recordSnapshot", () => {
  it("appends a reading taken on a new day", () => {
    const history = recordSnapshot([reading("2026-07-01", 100, 50)], reading("2026-08-01", 150, 40));

    expect(history.map((r) => r.volume)).toEqual([100, 150]);
  });

  it("replaces a reading taken the same day", () => {
    const later = { ...reading("2026-07-01", 120, 50), at: "2026-07-01T18:00:00.000Z" };

    const history = recordSnapshot([reading("2026-07-01", 100, 50)], later);

    expect(history).toEqual([later]);
  });

  it(`keeps only the latest ${MAX_SNAPSHOTS} readings`, () => {
    let history = [reading("2020-01-01", 0, 0)];
    for (let i = 1; i <= MAX_SNAPSHOTS + 5; i += 1) {
      const day = new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10);
      history = recordSnapshot(history, reading(day, i, 0));
    }

    expect(history).toHaveLength(MAX_SNAPSHOTS);
    expect(history[history.length - 1].volume).toBe(MAX_SNAPSHOTS + 5);
  });
});

describe("snapshotsOf", () => {
  it("uses the saved numbers when a keyword has no history yet", () => {
    expect(snapshotsOf({ createdAt: "2026-07-01T00:00:00.000Z", volume: 5, competition: 9 })).toEqual([
      { at: "2026-07-01T00:00:00.000Z", volume: 5, competition: 9 },
    ]);
  });
});

describe("movementOf", () => {
  it("is null with a single reading", () => {
    expect(movementOf({ createdAt: "2026-07-01T00:00:00.000Z", volume: 5, competition: 9 })).toBeNull();
  });

  it("compares the latest reading with the one before it", () => {
    const keyword = {
      createdAt: "2026-06-01T09:00:00.000Z",
      volume: 150,
      competition: 40,
      history: [reading("2026-06-01", 50, 10), reading("2026-07-01", 100, 50), reading("2026-08-01", 150, 40)],
    };

    expect(movementOf(keyword)).toEqual({ volume: 50, competition: -20, since: "2026-07-01T09:00:00.000Z" });
  });

  it("gives no percentage for a change from zero", () => {
    expect(percentChange(0, 10)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
  });
});
