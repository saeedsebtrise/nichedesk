import { describe, expect, it } from "vitest";

import { competitionBand, normalizeRules } from "./competition";

describe("normalizeRules", () => {
  it("keeps already-ascending cut-offs", () => {
    expect(normalizeRules({ green: 5000, lightGreen: 10000, orange: 20000 })).toEqual({
      green: 5000,
      lightGreen: 10000,
      orange: 20000,
    });
  });

  it("sorts cut-offs a user typed out of order", () => {
    expect(normalizeRules({ green: 5000, lightGreen: 10000, orange: 2000 })).toEqual({
      green: 2000,
      lightGreen: 5000,
      orange: 10000,
    });
  });

  it("floors negative and unreadable values at 0", () => {
    expect(normalizeRules({ green: -5, lightGreen: Number.NaN, orange: 10 })).toEqual({
      green: 0,
      lightGreen: 0,
      orange: 10,
    });
  });
});

describe("competitionBand", () => {
  const rules = { green: 5000, lightGreen: 10000, orange: 20000 };

  it("assigns each band by cut-off", () => {
    expect(competitionBand(465, rules)).toBe("green");
    expect(competitionBand(7000, rules)).toBe("lightGreen");
    expect(competitionBand(15000, rules)).toBe("orange");
    expect(competitionBand(930115, rules)).toBe("red");
  });

  it("treats each cut-off as the top of its band", () => {
    expect(competitionBand(5000, rules)).toBe("lightGreen");
    expect(competitionBand(10000, rules)).toBe("lightGreen");
    expect(competitionBand(10001, rules)).toBe("orange");
    expect(competitionBand(20000, rules)).toBe("orange");
  });

  it("still produces contiguous bands from out-of-order rules", () => {
    const messy = { green: 5000, lightGreen: 10000, orange: 2000 };

    expect(competitionBand(1000, messy)).toBe("green");
    expect(competitionBand(3000, messy)).toBe("lightGreen");
    expect(competitionBand(7000, messy)).toBe("orange");
    expect(competitionBand(20000, messy)).toBe("red");
  });
});
