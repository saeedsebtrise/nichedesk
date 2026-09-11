/**
 * Cut-offs for the competition badge colour, as shown in "Competition color rules".
 * Everything above `orange` is red.
 */
export type CompetitionRules = {
  green: number;
  lightGreen: number;
  orange: number;
};

export type CompetitionBand = "green" | "lightGreen" | "orange" | "red";

export const DEFAULT_COMPETITION_RULES: CompetitionRules = {
  green: 5_000,
  lightGreen: 10_000,
  orange: 20_000,
};

/**
 * Forces the three cut-offs to ascend.
 *
 * The inputs are three free-text boxes, so a user can easily leave them out of
 * order (green 5000, light green 10000, orange 2000). Sorting the values keeps
 * the bands contiguous instead of making the orange band unreachable.
 */
export function normalizeRules(rules: CompetitionRules): CompetitionRules {
  const [green, lightGreen, orange] = [rules.green, rules.lightGreen, rules.orange]
    .map((value) => (Number.isFinite(value) && value >= 0 ? Math.round(value) : 0))
    .sort((a, b) => a - b);

  return { green, lightGreen, orange };
}

export function competitionBand(value: number, rules: CompetitionRules): CompetitionBand {
  const { green, lightGreen, orange } = normalizeRules(rules);
  if (value < green) return "green";
  if (value <= lightGreen) return "lightGreen";
  if (value <= orange) return "orange";
  return "red";
}

export const BAND_CLASS: Record<CompetitionBand, string> = {
  green: "bg-emerald-800 text-white",
  lightGreen: "bg-emerald-200 text-emerald-900",
  orange: "bg-amber-400 text-amber-950",
  red: "bg-red-500 text-white",
};

/** Faint row tints for the dark work table. */
export const BAND_ROW_CLASS: Record<CompetitionBand, string> = {
  green: "bg-emerald-500/[0.07]",
  lightGreen: "bg-emerald-300/[0.035]",
  orange: "bg-amber-400/[0.045]",
  red: "bg-red-500/[0.045]",
};
