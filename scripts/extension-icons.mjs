/**
 * Draws the extension icons (extension/icons/icon-{16,32,48,128}.png): the
 * orange "N" tile from the NicheDesk wordmark, rendered by headless Edge so
 * every size is drawn natively rather than scaled from one bitmap.
 *
 *   node scripts/extension-icons.mjs
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "playwright-core";

const out = join(process.cwd(), "extension", "icons");
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const size of [16, 32, 48, 128]) {
  await page.setContent(`
    <body style="margin:0;background:transparent">
      <div id="icon" style="
        width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.24)}px;
        display:flex;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#ff8a3d 0%,#f4671f 55%,#e2560f 100%);
        color:#fff;font:900 ${Math.round(size * 0.68)}px/1 'Segoe UI Black','Segoe UI',Arial,sans-serif;
      ">N</div>
    </body>`);
  await page.locator("#icon").screenshot({ path: join(out, `icon-${size}.png`), omitBackground: true });
}

await browser.close();
console.log(`icons written to ${out}`);
