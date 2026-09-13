import { DEFAULT_COMPETITION_RULES, competitionBand, type CompetitionBand, type CompetitionRules } from "./competition";

/**
 * Volume colour bands and the colours a user picks for every band.
 *
 * Volume: above `high` is the top band, `low` to `high` the middle one, and
 * anything under `low` the bottom one. Colours are stored as #rrggbb so any
 * colour can be chosen, not just a preset.
 */
export type VolumeRules = { low: number; high: number };
export type VolumeBand = "high" | "mid" | "low";

export const DEFAULT_VOLUME_RULES: VolumeRules = { low: 200, high: 1_000 };

export type BandColors = {
  competition: Record<CompetitionBand, string>;
  volume: Record<VolumeBand, string>;
};

export const DEFAULT_COLORS: BandColors = {
  competition: { green: "#065f46", lightGreen: "#a7f3d0", orange: "#fbbf24", red: "#ef4444" },
  volume: { high: "#a7f3d0", mid: "#065f46", low: "#fde047" },
};

export const COMPETITION_BANDS: CompetitionBand[] = ["green", "lightGreen", "orange", "red"];
export const VOLUME_BANDS: VolumeBand[] = ["high", "mid", "low"];

/** Ready-made colours offered next to the free colour picker. */
export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Dark green", hex: "#065f46" },
  { name: "Green", hex: "#16a34a" },
  { name: "Light green", hex: "#a7f3d0" },
  { name: "Teal", hex: "#2dd4bf" },
  { name: "Blue", hex: "#38bdf8" },
  { name: "Purple", hex: "#a78bfa" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Yellow", hex: "#fde047" },
  { name: "Amber", hex: "#fbbf24" },
  { name: "Orange", hex: "#f97316" },
  { name: "Red", hex: "#ef4444" },
  { name: "Grey", hex: "#78716c" },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (value: unknown): value is string => typeof value === "string" && HEX.test(value);

/** Puts the two cut-offs in order, as whole numbers of at least 0. */
export function normalizeVolumeRules(rules: VolumeRules): VolumeRules {
  const [low, high] = [rules.low, rules.high]
    .map((value) => (Number.isFinite(value) && value >= 0 ? Math.round(value) : 0))
    .sort((a, b) => a - b);
  return { low, high };
}

export function volumeBand(value: number, rules: VolumeRules): VolumeBand {
  const { low, high } = normalizeVolumeRules(rules);
  if (value > high) return "high";
  if (value >= low) return "mid";
  return "low";
}

/** Stored colours with anything unreadable swapped for the default. */
export function normalizeColors(raw: unknown): BandColors {
  const colors = (raw ?? {}) as Partial<{ competition: Partial<Record<string, unknown>>; volume: Partial<Record<string, unknown>> }>;
  const pick = <B extends string>(bands: B[], stored: Partial<Record<string, unknown>> | undefined, fallback: Record<B, string>) =>
    Object.fromEntries(
      bands.map((band) => {
        const value = stored?.[band];
        return [band, isHexColor(value) ? value.toLowerCase() : fallback[band]];
      }),
    ) as Record<B, string>;

  return {
    competition: pick(COMPETITION_BANDS, colors.competition, DEFAULT_COLORS.competition),
    volume: pick(VOLUME_BANDS, colors.volume, DEFAULT_COLORS.volume),
  };
}

/** Near-black or white, whichever reads better on `hex`. */
export function readableText(hex: string): string {
  if (!isHexColor(hex)) return "#ffffff";
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.36 ? "#1c1410" : "#ffffff";
}

/** The part of the settings that decides how numbers are coloured. */
export type ColorSettings = { competitionRules: CompetitionRules; volumeRules: VolumeRules; colors: BandColors };

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
  competitionRules: DEFAULT_COMPETITION_RULES,
  volumeRules: DEFAULT_VOLUME_RULES,
  colors: DEFAULT_COLORS,
};

export const competitionColor = (value: number, settings: ColorSettings) =>
  settings.colors.competition[competitionBand(value, settings.competitionRules)];

export const volumeColor = (value: number, settings: ColorSettings) =>
  settings.colors.volume[volumeBand(value, settings.volumeRules)];
