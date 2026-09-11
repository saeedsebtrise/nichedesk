/**
 * Zips the extension for customers: dist/nichedesk-research-<version>.zip,
 * containing manifest.json, icons/ and src/ — tests are left out.
 *
 *   node scripts/pack-extension.mjs
 *
 * Customers unzip it and use chrome://extensions → Developer mode → Load unpacked.
 */
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "extension");
const manifest = JSON.parse(await readFile(join(source, "manifest.json"), "utf8"));

const dist = join(root, "dist");
const staging = join(dist, "nichedesk-research");
const zip = join(dist, `nichedesk-research-${manifest.version}.zip`);

await rm(staging, { recursive: true, force: true });
await rm(zip, { force: true });
await mkdir(staging, { recursive: true });

for (const entry of ["manifest.json", "icons", "src"]) {
  await cp(join(source, entry), join(staging, entry), { recursive: true });
}

if (process.platform === "win32") {
  // Windows' own bsdtar, by full path: Git Bash's GNU tar cannot write zips,
  // and PowerShell 5.1's Compress-Archive writes "src\lib\x.js" entry names,
  // which unzip on macOS/Linux as single files with backslashes in the name.
  const tar = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
  execFileSync(tar, ["-a", "-c", "-f", zip, "manifest.json", "icons", "src"], { cwd: staging });
} else {
  execFileSync("zip", ["-r", "-q", zip, "."], { cwd: staging });
}

await rm(staging, { recursive: true, force: true });
console.log(`packed ${zip}`);
