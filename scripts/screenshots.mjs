/**
 * Captures the product screenshots used on the landing page.
 *
 *   node scripts/seed-demo.mjs
 *   node --env-file=data/demo.env node_modules/next/dist/bin/next start -p 3100
 *   node scripts/screenshots.mjs
 *
 * (data/demo.env holds NICHEDESK_DATA_FILE=data/demo.json; the "nichedesk-demo"
 * launch config starts the same server.)
 *
 * Run against a production server: the dev server draws the Next.js
 * indicator in the corner, which would end up in every shot. The flows only
 * open dialogs and filter the unsaved preview, so the demo data is unchanged.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "playwright-core";

const BASE = process.env.SHOT_URL ?? "http://localhost:3100";
const OUT = join(process.cwd(), "src", "assets", "screenshots");
const CSV = join(process.cwd(), "data", "eRank - Keyword Tool - png.csv");

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  // 16:10 to match a laptop panel; 1.8x density gives a 2880x1800 image.
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1.8,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const settle = () => page.waitForTimeout(650);
const shot = (name) => join(OUT, name);
/** A sidebar link; the drawer copy only exists on small screens. */
const nav = (name) => page.getByRole("button", { name }).first();

/** Crops to the top `height` CSS pixels of an element, in document coordinates. */
async function cropTop(locator, name, height) {
  const box = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  });
  await page.screenshot({
    path: shot(name),
    fullPage: true,
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(height, box.height) },
  });
}

// 1. Overview — the dashboard.
await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
await nav(/^Overview$/).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: shot("overview.png") });

// 2. Upcoming Work — the hero shot.
await nav(/^Upcoming Work/).click();
await settle();
await page.screenshot({ path: shot("work.png") });

await page
  .locator("div.grid", { has: page.getByText("Total keywords", { exact: true }) })
  .first()
  .screenshot({ path: shot("stats.png") });

await page.getByRole("button", { name: /Filters & colours/ }).click();
await settle();
await page.getByRole("button", { name: "Edit colours" }).click();
await settle();
await page.locator("dialog[open]").screenshot({ path: shot("color-rules.png") });
await page.keyboard.press("Escape");
await settle();
await page.getByRole("button", { name: /Filters & colours/ }).click();
await settle();

await cropTop(page.locator('[data-shot="work-table"]'), "table.png", 470);

// 3. Niche manager — the tree with rolled-up counts.
await page.getByRole("button", { name: "Manage", exact: true }).first().click();
await settle();
await page.locator("dialog[open]").screenshot({ path: shot("niche-manager.png") });
await page.keyboard.press("Escape");
await settle();

// 4. Sort Keyword — an eRank export loaded and filtered.
await nav(/^Sort Keyword$/).click();
await page.setInputFiles('input[type="file"]', CSV);
await settle();
await page.getByRole("button", { name: "Including", exact: true }).click();
await page.getByPlaceholder("png, svg").fill("png");
await page.getByText("Select all matching").click();
await settle();
await page.screenshot({ path: shot("sort.png") });

// 5. Add to a niche — choosing a subniche, with "Nest under" filled in.
await page.getByRole("button", { name: /to a niche$/ }).click();
await settle();
const dialog = page.locator("dialog[open]");
await dialog.getByRole("button", { name: /christmas png/ }).first().click();
await dialog.getByLabel("New niche name").fill("valentine png");
await dialog.locator("#new-niche-parent").selectOption({ label: "png" });
await settle();
await dialog.screenshot({ path: shot("add-to-niche.png") });

await browser.close();
console.log(`screenshots written to ${OUT}`);
