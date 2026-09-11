/**
 * The seasonal occasions an Etsy seller plans around — when buyers start
 * searching for each, and when to start making for it.
 *
 * Keywords are matched to an occasion by the words they contain
 * ("christmas gnome png" → Christmas), so nothing needs tagging by hand. The
 * list runs most specific first: "halloween pumpkin" is Halloween, while a
 * plain "pumpkin spice shirt" falls through to Fall. All dates are UTC days.
 */

export type OccasionId =
  | "christmas"
  | "halloween"
  | "thanksgiving"
  | "valentines"
  | "st-patricks"
  | "mardi-gras"
  | "easter"
  | "mothers-day"
  | "fathers-day"
  | "graduation"
  | "pride"
  | "july-4th"
  | "back-to-school"
  | "new-year"
  | "fall"
  | "winter"
  | "spring"
  | "summer";

export type Occasion = {
  id: OccasionId;
  label: string;
  emoji: string;
  /** Phrases matched as whole words (a trailing "s" is allowed). */
  terms: string[];
  /** The day itself — or, for a season, its last good selling day — in `year`. */
  date: (year: number) => Date;
  /** Buyers search in the last `peakDays` before the date. */
  peakDays: number;
  /** Start designing and listing `prepDays` before the date. */
  prepDays: number;
};

const DAY_MS = 86_400_000;
/** "Coming up" means the making window opens within this many days. */
const SOON_DAYS = 45;

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));
const fixed = (month: number, day: number) => (year: number) => utc(year, month, day);
const startOfDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** The `n`th `weekday` (0 = Sunday) of a month — e.g. the 4th Thursday of November. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = utc(year, month, 1).getUTCDay();
  return utc(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

/** Western Easter Sunday, by the anonymous Gregorian algorithm. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

export const OCCASIONS: Occasion[] = [
  {
    id: "christmas",
    label: "Christmas",
    emoji: "🎄",
    terms: ["christmas", "xmas", "santa", "grinch", "reindeer", "north pole", "gingerbread", "nutcracker", "ugly sweater", "elf on the shelf", "candy cane", "jingle"],
    date: fixed(12, 25),
    peakDays: 60,
    prepDays: 115,
  },
  {
    id: "halloween",
    label: "Halloween",
    emoji: "🎃",
    terms: ["halloween", "spooky", "trick or treat", "jack o lantern", "witch", "witches", "ghost", "skeleton", "haunted", "boo"],
    date: fixed(10, 31),
    peakDays: 45,
    prepDays: 100,
  },
  {
    id: "thanksgiving",
    label: "Thanksgiving",
    emoji: "🦃",
    terms: ["thanksgiving", "friendsgiving", "thankful", "turkey day"],
    date: (year) => nthWeekday(year, 11, 4, 4),
    peakDays: 35,
    prepDays: 90,
  },
  {
    id: "valentines",
    label: "Valentine’s Day",
    emoji: "💘",
    terms: ["valentine", "galentine", "be mine"],
    date: fixed(2, 14),
    peakDays: 40,
    prepDays: 100,
  },
  {
    id: "st-patricks",
    label: "St. Patrick’s Day",
    emoji: "☘️",
    terms: ["st patrick", "st patricks", "saint patrick", "st paddy", "st pattys", "shamrock"],
    date: fixed(3, 17),
    peakDays: 30,
    prepDays: 75,
  },
  {
    id: "mardi-gras",
    label: "Mardi Gras",
    emoji: "🎭",
    terms: ["mardi gras", "fat tuesday"],
    date: (year) => new Date(easterSunday(year).getTime() - 47 * DAY_MS),
    peakDays: 30,
    prepDays: 75,
  },
  {
    id: "easter",
    label: "Easter",
    emoji: "🐣",
    terms: ["easter", "egg hunt", "he is risen"],
    date: easterSunday,
    peakDays: 35,
    prepDays: 85,
  },
  {
    id: "mothers-day",
    label: "Mother’s Day",
    emoji: "💐",
    terms: ["mothers day", "mother day"],
    date: (year) => nthWeekday(year, 5, 0, 2),
    peakDays: 30,
    prepDays: 80,
  },
  {
    id: "fathers-day",
    label: "Father’s Day",
    emoji: "👔",
    terms: ["fathers day", "father day"],
    date: (year) => nthWeekday(year, 6, 0, 3),
    peakDays: 30,
    prepDays: 80,
  },
  {
    id: "graduation",
    label: "Graduation",
    emoji: "🎓",
    terms: ["graduation", "graduate", "grad", "class of"],
    date: fixed(6, 1),
    peakDays: 45,
    prepDays: 90,
  },
  {
    id: "pride",
    label: "Pride Month",
    emoji: "🏳️‍🌈",
    terms: ["pride", "lgbt", "lgbtq"],
    date: fixed(6, 30),
    peakDays: 45,
    prepDays: 90,
  },
  {
    id: "july-4th",
    label: "4th of July",
    emoji: "🎆",
    terms: ["4th of july", "fourth of july", "july 4th", "independence day", "patriotic"],
    date: fixed(7, 4),
    peakDays: 30,
    prepDays: 80,
  },
  {
    id: "back-to-school",
    label: "Back to School",
    emoji: "🎒",
    terms: ["back to school", "first day of school", "first day of kindergarten"],
    date: fixed(8, 20),
    peakDays: 40,
    prepDays: 90,
  },
  {
    id: "new-year",
    label: "New Year",
    emoji: "🥂",
    terms: ["new year", "new years", "nye"],
    date: fixed(1, 1),
    peakDays: 30,
    prepDays: 75,
  },
  {
    id: "fall",
    label: "Fall",
    emoji: "🍂",
    terms: ["fall", "autumn", "pumpkin", "pumpkin spice", "cozy season", "harvest", "sweater weather"],
    date: fixed(11, 15),
    peakDays: 75,
    prepDays: 125,
  },
  {
    id: "winter",
    label: "Winter",
    emoji: "❄️",
    terms: ["winter", "snowman", "snowflake", "snow day", "frosty"],
    date: fixed(1, 31),
    peakDays: 75,
    prepDays: 125,
  },
  {
    id: "spring",
    label: "Spring",
    emoji: "🌷",
    terms: ["spring"],
    date: fixed(5, 31),
    peakDays: 75,
    prepDays: 120,
  },
  {
    id: "summer",
    label: "Summer",
    emoji: "☀️",
    terms: ["summer", "beach", "pool party", "sunshine"],
    date: fixed(8, 31),
    peakDays: 90,
    prepDays: 130,
  },
];

export const OCCASION_BY_ID = new Map(OCCASIONS.map((occasion) => [occasion.id, occasion]));

/** Lowercase words only: "Mother's Day T-Shirt" → "mothers day t shirt". */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// One pattern per occasion, compiled once: whole words, optional plural "s".
const MATCHERS = OCCASIONS.map((occasion) => ({
  occasion,
  pattern: new RegExp(`(?:^| )(?:${occasion.terms.map(normalize).join("|")})s?(?= |$)`),
}));

/** The occasion a keyword is for, judged by its words; null when it is not seasonal. */
export function detectOccasion(keyword: string): Occasion | null {
  const text = normalize(keyword);
  return MATCHERS.find(({ pattern }) => pattern.test(text))?.occasion ?? null;
}

export type OccasionWindow = {
  /** The day itself. */
  date: Date;
  /** When buyers start searching. */
  peakFrom: Date;
  /** When to start making and listing. */
  makeFrom: Date;
};

/** The next time an occasion comes round (today counts), with its making and selling windows. */
export function nextWindow(occasion: Occasion, today: Date): OccasionWindow {
  let date = occasion.date(today.getUTCFullYear());
  if (date.getTime() < startOfDay(today)) date = occasion.date(today.getUTCFullYear() + 1);
  return {
    date,
    peakFrom: new Date(date.getTime() - occasion.peakDays * DAY_MS),
    makeFrom: new Date(date.getTime() - occasion.prepDays * DAY_MS),
  };
}

/** "selling": buyers are searching · "make": time to design and list · "soon": that starts within six weeks. */
export type OccasionPhase = "selling" | "make" | "soon" | "later";

export function phaseOf(window: OccasionWindow, today: Date): OccasionPhase {
  const now = startOfDay(today);
  if (now >= window.peakFrom.getTime()) return "selling";
  if (now >= window.makeFrom.getTime()) return "make";
  if (window.makeFrom.getTime() - now <= SOON_DAYS * DAY_MS) return "soon";
  return "later";
}

/** Whole days from one date to another. */
export const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

/** "Dec 25" */
export const formatDay = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export type OccasionCount = { total: number; pending: number };

/** How many keywords each occasion has, and how many of those are still pending. */
export function countByOccasion(keywords: { keyword: string; status: string }[]): Map<OccasionId, OccasionCount> {
  const counts = new Map<OccasionId, OccasionCount>();
  for (const keyword of keywords) {
    const occasion = detectOccasion(keyword.keyword);
    if (!occasion) continue;
    const count = counts.get(occasion.id) ?? { total: 0, pending: 0 };
    count.total += 1;
    if (keyword.status === "pending") count.pending += 1;
    counts.set(occasion.id, count);
  }
  return counts;
}

export type SeasonRow = OccasionCount & { occasion: Occasion; window: OccasionWindow; phase: OccasionPhase };

/** Every occasion's next window and phase as seen from `today`, soonest first. */
export function seasonRows(today: Date, counts: Map<OccasionId, OccasionCount>): SeasonRow[] {
  return OCCASIONS.map((occasion) => {
    const window = nextWindow(occasion, today);
    return {
      occasion,
      window,
      phase: phaseOf(window, today),
      ...(counts.get(occasion.id) ?? { total: 0, pending: 0 }),
    };
  }).sort((a, b) => a.window.date.getTime() - b.window.date.getTime());
}
