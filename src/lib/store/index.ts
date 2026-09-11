import { neon } from "@neondatabase/serverless";

import { JsonFileStore, defaultStorePath } from "./json-file";
import { PostgresStore } from "./postgres";
import type { Store } from "./types";

let store: Store | undefined;

/**
 * The app's storage, resolved once per process: Postgres when a database URL
 * is configured (Vercel's Neon integration sets DATABASE_URL), otherwise the
 * local JSON file. The rest of the app only ever sees the Store interface.
 */
export function getStore(): Store {
  if (store) return store;

  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) {
    const sql = neon(url);
    store = new PostgresStore((text, params) => sql.query(text, params ?? []));
    return store;
  }

  // Vercel's disk is read-only and wiped between requests; a JSON file there
  // would silently lose every save, so refuse instead.
  if (process.env.VERCEL) {
    throw new Error(
      "No database is connected. In Vercel open Storage → Create → Neon (Postgres), connect it to this project, then redeploy.",
    );
  }

  store = new JsonFileStore(process.env.NICHEDESK_DATA_FILE ?? defaultStorePath);
  return store;
}

export * from "./types";
