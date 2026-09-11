/**
 * Writes the sample workspace and eRank-style CSV used for marketing
 * screenshots, into data/ — never touching the real data/nichedesk.json.
 *
 *   node scripts/seed-demo.mjs
 *
 * Every number here is illustrative sample data, not research results.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
const created = "2026-09-01T09:00:00.000Z";

const niches = [
  ["png", null],
  ["christmas png", "png"],
  ["christmas tree png", "christmas png"],
  ["halloween png", "png"],
  ["teacher png", "png"],
  ["svg files", null],
  ["cricut svg", "svg files"],
  ["mom svg", "svg files"],
  ["t-shirt designs", null],
  ["fall shirt", "t-shirt designs"],
  ["funny tee", "t-shirt designs"],
];

const nicheId = (name) => `n-${name.replace(/\s+/g, "-")}`;

// keyword, volume, competition, niche, trend, type, status, tick
const keywords = [
  ["later gator png", 7432, 465, "png", "Trending", "Grey hat", "pending", true],
  ["labubu png", 7116, 1236, "png", "Trending", "Black hat", "pending", false],
  ["huntrix png", 6924, 4966, "png", "Trending", "Grey hat", "pending", false],
  ["250th anniversary png", 5903, 2163, "png", "Seasonal", "White hat", "pending", false],
  ["showgirl png", 2539, 2657, "png", "Trending", "White hat", "pending", true],
  ["stranger things png", 2482, 570, "png", "Trending", "Black hat", "pending", false],
  ["world cup png", 2334, 1203, "png", "Seasonal", "Grey hat", "pending", false],
  ["valentine goose png", 1890, 119, "png", "Seasonal", "White hat", "pending", true],
  ["retro sunset png", 1650, 8450, "png", "Evergreen", "White hat", "pending", false],
  ["boho rainbow png", 1420, 12900, "png", "Evergreen", "White hat", "done", false],
  ["christmas png", 48212, 930115, "christmas png", "Seasonal", "White hat", "pending", false],
  ["grinch png", 4410, 18760, "christmas png", "Seasonal", "Black hat", "pending", false],
  ["santa png", 3980, 22410, "christmas png", "Seasonal", "White hat", "pending", false],
  ["christmas gnome png", 3120, 1890, "christmas png", "Seasonal", "White hat", "pending", true],
  ["christmas sublimation png", 2870, 9640, "christmas png", "Seasonal", "White hat", "done", false],
  ["christmas tree png", 2540, 7450, "christmas tree png", "Seasonal", "White hat", "pending", false],
  ["watercolor christmas tree png", 890, 1320, "christmas tree png", "Seasonal", "White hat", "pending", true],
  ["halloween png", 45532, 545600, "halloween png", "Seasonal", "White hat", "pending", false],
  ["ghost png", 3310, 4120, "halloween png", "Seasonal", "White hat", "pending", true],
  ["spooky season png", 2760, 6890, "halloween png", "Seasonal", "White hat", "pending", false],
  ["skeleton png", 2105, 3870, "halloween png", "Seasonal", "White hat", "done", false],
  ["teacher png", 11451, 216592, "teacher png", "Evergreen", "White hat", "pending", false],
  ["back to school png", 5120, 15480, "teacher png", "Seasonal", "White hat", "pending", false],
  ["teacher appreciation png", 2230, 3140, "teacher png", "Seasonal", "White hat", "pending", true],
  ["svg files", 9820, 184300, "svg files", "Evergreen", "White hat", "pending", false],
  ["layered svg", 3110, 4650, "svg files", "Evergreen", "White hat", "pending", false],
  ["cricut svg", 6240, 52890, "cricut svg", "Evergreen", "White hat", "pending", false],
  ["cricut shirt svg", 2360, 8760, "cricut svg", "Evergreen", "White hat", "done", false],
  ["cricut mug svg", 1480, 2210, "cricut svg", "Evergreen", "White hat", "pending", true],
  ["mama svg", 4870, 35120, "mom svg", "Evergreen", "White hat", "pending", false],
  ["boy mom svg", 2140, 1760, "mom svg", "Evergreen", "White hat", "pending", true],
  ["dog mom svg", 1930, 4020, "mom svg", "Evergreen", "White hat", "pending", false],
  ["funny shirt", 5210, 68400, "t-shirt designs", "Evergreen", "White hat", "pending", false],
  ["pumpkin spice shirt", 2640, 9120, "fall shirt", "Seasonal", "White hat", "pending", false],
  ["cozy season shirt", 1880, 2410, "fall shirt", "Seasonal", "White hat", "pending", true],
  ["great fall shirt", 1204, 113455, "fall shirt", "Seasonal", "White hat", "pending", false],
  ["harvest tee", 980, 25269, "fall shirt", "Seasonal", "White hat", "pending", false],
  ["funny cat tee", 1760, 4480, "funny tee", "Evergreen", "Grey hat", "pending", false],
  ["sarcastic tee", 1310, 3050, "funny tee", "Evergreen", "White hat", "done", false],
];

const workspace = {
  niches: niches.map(([name, parent]) => ({
    id: nicheId(name),
    name,
    parentId: parent ? nicheId(parent) : null,
    createdAt: created,
  })),
  keywords: keywords.map(([keyword, volume, competition, niche, trend, type, status, tick], i) => ({
    id: `k-${i}`,
    keyword,
    volume,
    competition,
    nicheId: nicheId(niche),
    trend,
    type,
    status,
    tick,
    createdAt: created,
  })),
  settings: {
    competitionRules: { green: 5000, lightGreen: 10000, orange: 20000 },
    visibleColumns: ["niche", "volume", "competition", "tick", "trend", "type"],
  },
};

// A deterministic pseudo-random stream, so every run produces identical shots.
let seed = 42;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const modifiers = [
  "christmas", "halloween", "summer", "fall", "trending", "teacher", "retro", "boho",
  "funny", "cute", "vintage", "western", "floral", "cowgirl", "disco", "coquette",
  "nurse", "mama", "dog", "cat", "easter", "valentine", "patriotic", "birthday",
  "football", "baseball", "graduation", "wedding", "camping", "gnome",
];
const bases = ["png", "svg", "shirt", "sublimation png"];

const rows = [];
for (const modifier of modifiers) {
  for (const base of bases) {
    const volume = Math.round(400 + random() ** 2 * 48000);
    const competition = Math.round(80 + random() ** 3 * 900000);
    rows.push([`${modifier} ${base}`, volume, competition]);
  }
}
rows.sort((a, b) => b[1] - a[1]);

const fmt = (n) => `"${n.toLocaleString("en-US")}"`;
const csv = [
  "eRank - Keyword Tool - png",
  "",
  "Keywords,Search Trend,Avg. Searches,Avg. Clicks,CTR,Competition,KD",
  ...rows.map(
    ([keyword, volume, competition]) =>
      `${keyword},Jun 26,${fmt(volume)},${fmt(Math.round(volume * 1.3))},130%,${fmt(competition)},${Math.round(20 + random() * 60)}`,
  ),
].join("\n");

await mkdir(dataDir, { recursive: true });
await writeFile(join(dataDir, "demo.json"), JSON.stringify(workspace, null, 2));
await writeFile(join(dataDir, "eRank - Keyword Tool - png.csv"), csv);

console.log(
  `demo.json: ${workspace.niches.length} niches, ${workspace.keywords.length} keywords; CSV: ${rows.length} rows`,
);
