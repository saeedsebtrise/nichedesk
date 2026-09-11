import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { License } from "@/features/licenses/licenses";
import { DocumentStore, coerceLicenses, coerceWorkspace } from "./document";
import type { StoreData } from "./types";

/** Everything on disk: the workspace plus license records the workspace API never exposes. */
type FileData = StoreData & { licenses: License[] };

/**
 * Local backend: both documents in one JSON file.
 *
 * Writes are serialised through a promise chain and land via a temp file plus
 * rename, so a crash mid-write cannot leave a half-written data file behind.
 * Hosts with a read-only or throwaway disk (Vercel) need PostgresStore.
 */
export class JsonFileStore extends DocumentStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {
    super();
  }

  private async readFileData(): Promise<FileData> {
    let raw: unknown = null;
    try {
      raw = JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      // A missing file is the first run; unparseable JSON should not brick the
      // app either, so both start from an empty dataset.
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      if (!missing && !(error instanceof SyntaxError)) throw error;
    }

    return {
      ...coerceWorkspace(raw),
      licenses: coerceLicenses((raw as { licenses?: unknown } | null)?.licenses),
    };
  }

  /** Runs `mutate` with exclusive access to the file and persists the result. */
  private write<T>(mutate: (data: FileData) => T): Promise<T> {
    const run = async (): Promise<T> => {
      const data = await this.readFileData();
      const result = mutate(data);

      await mkdir(dirname(this.filePath), { recursive: true });
      const temp = this.filePath + "." + process.pid + ".tmp";
      await writeFile(temp, JSON.stringify(data, null, 2), "utf8");
      await rename(temp, this.filePath);

      return result;
    };

    const next = this.queue.then(run, run);
    // Keep the chain alive after a rejection so one bad write cannot wedge the store.
    this.queue = next.catch(() => undefined);
    return next;
  }

  protected async loadWorkspace(): Promise<StoreData> {
    // Destructured out so license keys can never ride along to the browser.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { licenses, ...workspace } = await this.readFileData();
    return workspace;
  }

  protected updateWorkspace<T>(mutate: (data: StoreData) => T): Promise<T> {
    return this.write((data) => mutate(data));
  }

  protected async loadLicenses(): Promise<License[]> {
    return (await this.readFileData()).licenses;
  }

  protected updateLicenses<T>(mutate: (licenses: License[]) => T): Promise<T> {
    return this.write((data) => mutate(data.licenses));
  }
}

export const defaultStorePath = join(process.cwd(), "data", "nichedesk.json");
