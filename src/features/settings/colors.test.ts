import { describe, expect, it } from "vitest";

import {
  DEFAULT_COLORS,
  DEFAULT_COLOR_SETTINGS,
  competitionColor,
  normalizeColors,
  normalizeVolumeRules,
  readableText,
  volumeBand,
  volumeColor,
} from "./colors";

describe("volumeBand", () => {
  const rules = { low: 200, high: 1000 };

  it("puts volume above 1,000 in the top band, 200–1,000 in the middle and under 200 at the bottom", () => {
    expect(volumeBand(7733, rules)).toBe("high");
    expect(volumeBand(1001, rules)).toBe("high");
    expect(volumeBand(1000, rules)).toBe("mid");
    expect(volumeBand(200, rules)).toBe("mid");
    expect(volumeBand(199, rules)).toBe("low");
  });

  it("still works when the cut-offs were typed the wrong way round", () => {
    expect(normalizeVolumeRules({ low: 1000, high: 200 })).toEqual({ low: 200, high: 1000 });
    expect(volumeBand(500, { low: 1000, high: 200 })).toBe("mid");
  });
});

describe("colours", () => {
  it("defaults to light green, dark green and yellow for volume", () => {
    expect(volumeColor(5000, DEFAULT_COLOR_SETTINGS)).toBe(DEFAULT_COLORS.volume.high);
    expect(volumeColor(500, DEFAULT_COLOR_SETTINGS)).toBe("#065f46");
    expect(volumeColor(50, DEFAULT_COLOR_SETTINGS)).toBe("#fde047");
    expect(competitionColor(465, DEFAULT_COLOR_SETTINGS)).toBe(DEFAULT_COLORS.competition.green);
  });

  it("keeps a user's valid colours and replaces broken ones", () => {
    const colors = normalizeColors({ volume: { high: "#FF0000", mid: "blue", low: 7 } });

    expect(colors.volume).toEqual({ high: "#ff0000", mid: DEFAULT_COLORS.volume.mid, low: DEFAULT_COLORS.volume.low });
    expect(colors.competition).toEqual(DEFAULT_COLORS.competition);
  });

  it("picks dark text on light colours and white on dark ones", () => {
    expect(readableText("#fde047")).toBe("#1c1410");
    expect(readableText("#065f46")).toBe("#ffffff");
  });
});
