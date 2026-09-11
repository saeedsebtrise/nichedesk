import type { License } from "@/features/licenses/licenses";
import { DocumentStore, coerceLicenses, coerceWorkspace } from "./document";
import type { StoreData } from "./types";

/** Runs one parameterised statement and returns its rows. */
export type SqlExecutor = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const TABLE = "nichedesk_documents";
const WORKSPACE = "workspace";
const LICENSES = "licenses";
const MAX_ATTEMPTS = 8;

/** Thrown when a write keeps colliding with others; the request can simply be retried. */
export class StoreBusyError extends Error {}

/**
 * Hosted backend: the workspace and the license list as two JSONB rows.
 *
 * Every save is guarded by a version number (optimistic concurrency): the
 * UPDATE only lands if nobody else saved since this request read the row;
 * otherwise the change is re-applied to a fresh copy. That needs no
 * long-lived transaction, so it works over Neon's stateless HTTP driver on
 * serverless functions. Licenses live in their own row so the extension's
 * frequent license checks never contend with workspace edits.
 */
export class PostgresStore extends DocumentStore {
  private ready: Promise<void> | null = null;

  constructor(
    private readonly sql: SqlExecutor,
    private readonly pause: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    super();
  }

  /** Creates the table on first use; a failed attempt is retried next time. */
  private ensureTable(): Promise<void> {
    this.ready ??= this.sql(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
         id text PRIMARY KEY,
         data jsonb NOT NULL,
         version integer NOT NULL DEFAULT 0,
         updated_at timestamptz NOT NULL DEFAULT now()
       )`,
    ).then(
      () => undefined,
      (error) => {
        this.ready = null;
        throw error;
      },
    );
    return this.ready;
  }

  private async load(id: string): Promise<{ data: unknown; version: number } | null> {
    await this.ensureTable();
    const rows = await this.sql(`SELECT data, version FROM ${TABLE} WHERE id = $1`, [id]);
    if (rows.length === 0) return null;
    const data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
    return { data, version: Number(rows[0].version) };
  }

  private async update<D, T>(id: string, coerce: (raw: unknown) => D, mutate: (doc: D) => T): Promise<T> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const current = await this.load(id);
      const doc = coerce(current?.data ?? null);
      const result = mutate(doc);
      const json = JSON.stringify(doc);

      const saved = current
        ? await this.sql(
            `UPDATE ${TABLE} SET data = $2::jsonb, version = version + 1, updated_at = now()
             WHERE id = $1 AND version = $3 RETURNING version`,
            [id, json, current.version],
          )
        : await this.sql(
            `INSERT INTO ${TABLE} (id, data, version) VALUES ($1, $2::jsonb, 1)
             ON CONFLICT (id) DO NOTHING RETURNING version`,
            [id, json],
          );

      if (saved.length > 0) return result;
      // Someone saved first: back off a little (with jitter) and re-apply.
      await this.pause(15 * 2 ** attempt + Math.random() * 20);
    }

    throw new StoreBusyError("NicheDesk is busy saving other changes — please try again.");
  }

  protected async loadWorkspace(): Promise<StoreData> {
    return coerceWorkspace((await this.load(WORKSPACE))?.data ?? null);
  }

  protected updateWorkspace<T>(mutate: (data: StoreData) => T): Promise<T> {
    return this.update(WORKSPACE, coerceWorkspace, mutate);
  }

  protected async loadLicenses(): Promise<License[]> {
    return coerceLicenses((await this.load(LICENSES))?.data ?? null);
  }

  protected updateLicenses<T>(mutate: (licenses: License[]) => T): Promise<T> {
    return this.update(LICENSES, coerceLicenses, mutate);
  }
}
