import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PostgresStore, StoreBusyError, type SqlExecutor } from "./postgres";
import { StoreValidationError } from "./types";

// PGlite is real Postgres compiled to WebAssembly, so these tests run the
// store's actual SQL — CREATE TABLE, jsonb casts, versioned UPDATEs.
let db: PGlite;
let sql: SqlExecutor;
const noPause = () => Promise.resolve();

beforeAll(async () => {
  db = new PGlite();
  sql = async (text, params) => (await db.query<Record<string, unknown>>(text, params)).rows;
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.query("DROP TABLE IF EXISTS nichedesk_documents");
});

const row = (keyword: string) => ({ id: keyword, keyword, volume: 100, competition: 200 });

describe("PostgresStore", () => {
  it("starts with an empty workspace and creates its table on first use", async () => {
    const data = await new PostgresStore(sql, noPause).read();

    expect(data.niches).toEqual([]);
    expect(data.settings.competitionRules.green).toBeGreaterThan(0);
  });

  it("persists the niche tree and keywords for every instance sharing the database", async () => {
    const writer = new PostgresStore(sql, noPause);
    const parent = await writer.createNiche({ name: "png", parentId: null });
    const child = await writer.createNiche({ name: "christmas png", parentId: parent.id });
    await writer.importKeywords([row("santa png"), row("SANTA png")], child.id);

    const reader = new PostgresStore(sql, noPause);
    const data = await reader.read();

    expect(data.niches.find((n) => n.id === child.id)?.parentId).toBe(parent.id);
    expect(data.keywords.map((k) => k.keyword)).toEqual(["santa png"]);
  });

  it("keeps licenses in their own row and out of read()", async () => {
    const store = new PostgresStore(sql, noPause);
    const { key } = await store.createLicense({ days: 30, note: "", maxDevices: 1 });

    await expect(store.checkLicense(key, "device-aaaa")).resolves.toMatchObject({ valid: true });
    await expect(store.checkLicense(key, "device-bbbb")).resolves.toMatchObject({ reason: "device-limit" });
    expect(Object.keys(await store.read())).toEqual(["niches", "keywords", "settings", "inbox"]);

    const ids = (await db.query<{ id: string }>("SELECT id FROM nichedesk_documents ORDER BY id")).rows;
    expect(ids.map((r) => r.id)).toEqual(["licenses"]);
  });

  it("re-applies a change when another save lands first", async () => {
    const store = new PostgresStore(sql, noPause);
    await store.createNiche({ name: "png", parentId: null });

    // Sneak a competing save in between this request's read and its write.
    let interfered = false;
    const racing: SqlExecutor = async (text, params) => {
      if (!interfered && text.trimStart().startsWith("UPDATE")) {
        interfered = true;
        await new PostgresStore(sql, noPause).createNiche({ name: "svg", parentId: null });
      }
      return sql(text, params);
    };

    await new PostgresStore(racing, noPause).createNiche({ name: "shirts", parentId: null });

    const names = (await store.read()).niches.map((n) => n.name).sort();
    expect(names).toEqual(["png", "shirts", "svg"]);
  });

  it("lands every one of several simultaneous saves", async () => {
    const stores = [new PostgresStore(sql, noPause), new PostgresStore(sql, noPause)];

    await Promise.all(
      Array.from({ length: 6 }, (_, i) => stores[i % 2].createNiche({ name: `niche-${i}`, parentId: null })),
    );

    expect((await stores[0].read()).niches).toHaveLength(6);
  });

  it("gives up with a retryable error if it can never win", async () => {
    const store = new PostgresStore(sql, noPause);
    await store.createNiche({ name: "png", parentId: null });

    const alwaysLoses: SqlExecutor = async (text, params) =>
      text.trimStart().startsWith("UPDATE") ? [] : sql(text, params);

    await expect(
      new PostgresStore(alwaysLoses, noPause).createNiche({ name: "svg", parentId: null }),
    ).rejects.toThrow(StoreBusyError);
  });

  it("reports validation errors at once instead of retrying", async () => {
    const store = new PostgresStore(sql, noPause);

    await expect(store.createNiche({ name: "  ", parentId: null })).rejects.toThrow(StoreValidationError);
  });
});
