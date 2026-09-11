import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonFileStore } from "./json-file";
import { StoreValidationError } from "./types";

let dir: string;
let store: JsonFileStore;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "nichedesk-"));
  file = join(dir, "data.json");
  store = new JsonFileStore(file);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const row = (keyword: string, volume = 10, competition = 20) => ({
  id: keyword,
  keyword,
  volume,
  competition,
});

describe("read", () => {
  it("starts empty when the file does not exist", async () => {
    const data = await store.read();

    expect(data.niches).toEqual([]);
    expect(data.keywords).toEqual([]);
    expect(data.settings.competitionRules.green).toBeGreaterThan(0);
  });

  it("starts empty rather than throwing on an unparseable file", async () => {
    await writeFile(file, "{ not json", "utf8");

    expect((await store.read()).niches).toEqual([]);
  });

  it("repairs keywords missing newer fields", async () => {
    await writeFile(
      file,
      JSON.stringify({ keywords: [{ id: "k1", keyword: "png" }] }),
      "utf8",
    );

    const [keyword] = (await store.read()).keywords;

    expect(keyword).toMatchObject({
      volume: 0,
      competition: 0,
      nicheId: null,
      trend: "Evergreen",
      type: "White hat",
      status: "pending",
      tick: false,
    });
  });
});

describe("createNiche", () => {
  it("nests a subniche under its parent", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });

    expect(child.parentId).toBe(parent.id);
  });

  it("rejects a duplicate name under the same parent", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    await store.createNiche({ name: "christmas png", parentId: parent.id });

    await expect(
      store.createNiche({ name: "Christmas PNG", parentId: parent.id }),
    ).rejects.toThrow(StoreValidationError);
  });

  it("allows the same name under a different parent", async () => {
    const png = await store.createNiche({ name: "png", parentId: null });
    const svg = await store.createNiche({ name: "svg", parentId: null });

    await store.createNiche({ name: "christmas", parentId: png.id });

    await expect(store.createNiche({ name: "christmas", parentId: svg.id })).resolves.toBeTruthy();
  });

  it("rejects a parent that does not exist", async () => {
    await expect(store.createNiche({ name: "orphan", parentId: "nope" })).rejects.toThrow(
      StoreValidationError,
    );
  });
});

describe("updateNiche", () => {
  it("refuses to nest a niche inside its own descendant", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });

    await expect(store.updateNiche(parent.id, { parentId: child.id })).rejects.toThrow(
      /cannot be moved inside itself/,
    );
  });

  it("moves a subtree to the top level", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });

    expect((await store.updateNiche(child.id, { parentId: null })).parentId).toBeNull();
  });
});

describe("deleteNiche", () => {
  it("lifts children and keywords one level on reparent", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });
    const grandchild = await store.createNiche({ name: "tree png", parentId: child.id });
    await store.importKeywords([row("christmas gnome")], child.id);

    await store.deleteNiche(child.id, "reparent");
    const data = await store.read();

    expect(data.niches.map((niche) => niche.id)).toEqual([parent.id, grandchild.id]);
    expect(data.niches.find((niche) => niche.id === grandchild.id)?.parentId).toBe(parent.id);
    expect(data.keywords[0].nicheId).toBe(parent.id);
  });

  it("removes the whole subtree and its keywords on cascade", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });
    await store.importKeywords([row("in child")], child.id);
    await store.importKeywords([row("in parent")], parent.id);

    await store.deleteNiche(child.id, "cascade");
    const data = await store.read();

    expect(data.niches.map((niche) => niche.name)).toEqual(["png"]);
    expect(data.keywords.map((keyword) => keyword.keyword)).toEqual(["in parent"]);
  });

  it("keeps unassigned keywords when cascading", async () => {
    const niche = await store.createNiche({ name: "png", parentId: null });
    await store.createKeyword({ keyword: "loose", volume: 1, competition: 1, nicheId: null });

    await store.deleteNiche(niche.id, "cascade");

    expect((await store.read()).keywords.map((k) => k.keyword)).toEqual(["loose"]);
  });
});

describe("importKeywords", () => {
  it("skips keywords the target niche already holds, case-insensitively", async () => {
    const niche = await store.createNiche({ name: "png", parentId: null });
    await store.importKeywords([row("christmas png")], niche.id);

    const result = await store.importKeywords(
      [row("Christmas PNG"), row("halloween png")],
      niche.id,
    );

    expect(result).toEqual({ added: 1, skipped: 1 });
    expect((await store.read()).keywords).toHaveLength(2);
  });

  it("allows the same keyword in a different niche", async () => {
    const parent = await store.createNiche({ name: "png", parentId: null });
    const child = await store.createNiche({ name: "christmas png", parentId: parent.id });

    await store.importKeywords([row("santa png")], parent.id);
    const result = await store.importKeywords([row("santa png")], child.id);

    expect(result).toEqual({ added: 1, skipped: 0 });
  });
});

describe("bulkKeywords", () => {
  it("marks the selected keywords done and leaves the rest alone", async () => {
    const a = await store.createKeyword({ keyword: "a", volume: 0, competition: 0, nicheId: null });
    await store.createKeyword({ keyword: "b", volume: 0, competition: 0, nicheId: null });

    expect(await store.bulkKeywords([a.id], { action: "done" })).toBe(1);

    const data = await store.read();
    expect(data.keywords.find((k) => k.id === a.id)?.status).toBe("done");
    expect(data.keywords.find((k) => k.keyword === "b")?.status).toBe("pending");
  });

  it("moves keywords into a niche", async () => {
    const niche = await store.createNiche({ name: "png", parentId: null });
    const keyword = await store.createKeyword({
      keyword: "a",
      volume: 0,
      competition: 0,
      nicheId: null,
    });

    await store.bulkKeywords([keyword.id], { action: "move", nicheId: niche.id });

    expect((await store.read()).keywords[0].nicheId).toBe(niche.id);
  });

  it("ignores ids that are not present", async () => {
    expect(await store.bulkKeywords(["ghost"], { action: "delete" })).toBe(0);
  });
});

describe("concurrent writes", () => {
  it("does not lose writes issued in parallel", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        store.createNiche({ name: `niche-${index}`, parentId: null }),
      ),
    );

    expect((await store.read()).niches).toHaveLength(25);
  });

  it("keeps serving writes after one is rejected", async () => {
    await expect(store.createNiche({ name: "  ", parentId: null })).rejects.toThrow();

    await expect(store.createNiche({ name: "png", parentId: null })).resolves.toBeTruthy();
  });

  it("leaves no temp file behind", async () => {
    await store.createNiche({ name: "png", parentId: null });

    await expect(readFile(file, "utf8")).resolves.toContain("png");
  });
});

describe("updateSettings", () => {
  it("stores competition cut-offs in ascending order", async () => {
    const settings = await store.updateSettings({
      competitionRules: { green: 5000, lightGreen: 10000, orange: 2000 },
    });

    expect(settings.competitionRules).toEqual({ green: 2000, lightGreen: 5000, orange: 10000 });
  });
});

describe("automatic subniches", () => {
  const patternRows = [
    "crochet pattern",
    "crochet pattern for beginners",
    "easy crochet pattern",
    "sewing pattern",
    "sewing pattern dress",
    "sewing patterns women",
    "amigurumi pattern",
  ].map((keyword) => row(keyword));

  it("sorts an import into subniches of the chosen niche", async () => {
    const parent = await store.createNiche({ name: "Pattern", parentId: null });

    const result = await store.importKeywords(patternRows, parent.id, { autoSubniches: { minGroupSize: 3 } });
    const data = await store.read();

    expect(result).toMatchObject({ added: 7, skipped: 0, stayed: 1 });
    expect(result.subniches?.map((s) => [s.name, s.added, s.created])).toEqual([
      ["crochet pattern", 3, true],
      ["sewing pattern", 3, true],
    ]);
    const crochet = data.niches.find((n) => n.name === "crochet pattern");
    expect(crochet?.parentId).toBe(parent.id);
    expect(data.keywords.filter((k) => k.nicheId === crochet?.id)).toHaveLength(3);
    expect(data.keywords.find((k) => k.keyword === "amigurumi pattern")?.nicheId).toBe(parent.id);
  });

  it("reuses a subniche that already exists and skips keywords it holds", async () => {
    const parent = await store.createNiche({ name: "Pattern", parentId: null });
    await store.importKeywords(patternRows, parent.id, { autoSubniches: { minGroupSize: 3 } });

    const again = await store.importKeywords(patternRows, parent.id, { autoSubniches: { minGroupSize: 3 } });

    expect(again.added).toBe(0);
    expect(again.skipped).toBe(7);
    expect(again.subniches?.every((s) => !s.created)).toBe(true);
    expect((await store.read()).niches).toHaveLength(3);
  });

  it("imports straight into the niche when auto subniches are off", async () => {
    const parent = await store.createNiche({ name: "Pattern", parentId: null });

    const result = await store.importKeywords(patternRows, parent.id);

    expect(result).toEqual({ added: 7, skipped: 0 });
    expect((await store.read()).niches).toHaveLength(1);
  });

  it("sorts a niche's existing keywords into subniches", async () => {
    const parent = await store.createNiche({ name: "Pattern", parentId: null });
    await store.importKeywords(patternRows, parent.id);

    const result = await store.autoGroupNiche(parent.id, { minGroupSize: 3 });
    const data = await store.read();

    expect(result.subniches.map((s) => [s.name, s.moved])).toEqual([
      ["crochet pattern", 3],
      ["sewing pattern", 3],
    ]);
    expect(result.stayed).toBe(1);
    expect(data.keywords.filter((k) => k.nicheId === parent.id).map((k) => k.keyword)).toEqual([
      "amigurumi pattern",
    ]);
  });

  it("leaves a keyword in place rather than duplicate it in a subniche that has it", async () => {
    const parent = await store.createNiche({ name: "Pattern", parentId: null });
    const crochet = await store.createNiche({ name: "crochet pattern", parentId: parent.id });
    await store.importKeywords([row("crochet pattern")], crochet.id);
    await store.importKeywords(patternRows, parent.id);

    const result = await store.autoGroupNiche(parent.id, { minGroupSize: 3 });
    const data = await store.read();

    expect(result.subniches.find((s) => s.name === "crochet pattern")).toMatchObject({ created: false, moved: 2 });
    expect(data.keywords.filter((k) => k.keyword === "crochet pattern")).toHaveLength(2);
  });

  it("rejects a niche that does not exist", async () => {
    await expect(store.autoGroupNiche("nope")).rejects.toThrow(StoreValidationError);
  });
});

describe("licenses", () => {
  it("issues a key that expires the given number of days out", async () => {
    const license = await store.createLicense({ days: 30, note: "Ali", maxDevices: 3 });

    expect(license.key).toMatch(/^NDSK-/);
    const days = (Date.parse(license.expiresAt) - Date.parse(license.createdAt)) / 86_400_000;
    expect(days).toBeCloseTo(30, 5);
  });

  it("never exposes license keys through read()", async () => {
    await store.createLicense({ days: 30, note: "", maxDevices: 3 });

    expect(Object.keys(await store.read())).toEqual(["niches", "keywords", "settings"]);
    await expect(readFile(file, "utf8")).resolves.toContain("NDSK-");
  });

  it("validates a key, claims a seat, and accepts messy formatting", async () => {
    const { key } = await store.createLicense({ days: 30, note: "", maxDevices: 3 });

    const result = await store.checkLicense(` ${key.toLowerCase().replace(/-/g, " ")} `, "device-aaaa");

    expect(result).toMatchObject({ valid: true, devicesUsed: 1, maxDevices: 3 });
    expect((await store.listLicenses())[0].devices.map((d) => d.id)).toEqual(["device-aaaa"]);
  });

  it("does not spend a second seat on a device that checks in again", async () => {
    const { key } = await store.createLicense({ days: 30, note: "", maxDevices: 2 });

    await store.checkLicense(key, "device-aaaa");
    const again = await store.checkLicense(key, "device-aaaa");

    expect(again).toMatchObject({ valid: true, devicesUsed: 1 });
  });

  it("refuses a device beyond the limit until the seats are reset", async () => {
    const { key } = await store.createLicense({ days: 30, note: "", maxDevices: 1 });
    await store.checkLicense(key, "device-aaaa");

    await expect(store.checkLicense(key, "device-bbbb")).resolves.toMatchObject({
      valid: false,
      reason: "device-limit",
    });

    await store.updateLicense(key, "reset-devices");
    await expect(store.checkLicense(key, "device-bbbb")).resolves.toMatchObject({ valid: true });
  });

  it("refuses a revoked key", async () => {
    const { key } = await store.createLicense({ days: 30, note: "", maxDevices: 3 });

    await store.updateLicense(key, "revoke");

    await expect(store.checkLicense(key, "device-aaaa")).resolves.toMatchObject({
      valid: false,
      reason: "revoked",
    });
  });

  it("reports an unknown or malformed key as unknown", async () => {
    await expect(store.checkLicense("NDSK-AAAA-BBBB-CCCC", "device-aaaa")).resolves.toEqual({
      valid: false,
      reason: "unknown",
    });
    await expect(store.checkLicense("not a key", "device-aaaa")).resolves.toEqual({
      valid: false,
      reason: "unknown",
    });
  });

  it("rejects an action on a key that does not exist", async () => {
    await expect(store.updateLicense("NDSK-AAAA-BBBB-CCCC", "revoke")).rejects.toThrow(
      StoreValidationError,
    );
  });
});
