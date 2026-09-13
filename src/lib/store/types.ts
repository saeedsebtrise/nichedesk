import type { BandColors, VolumeRules } from "@/features/settings/colors";
import type { CompetitionRules } from "@/features/settings/competition";
import type { License, LicenseCheck } from "@/features/licenses/licenses";
import type { Niche } from "@/features/niches/types";
import type { ImportRow, Keyword, KeywordType, Status, Trend } from "@/features/keywords/types";

export type ColumnKey = "niche" | "volume" | "competition" | "tick" | "trend" | "type";

export type Settings = {
  competitionRules: CompetitionRules;
  volumeRules: VolumeRules;
  /** The colour of each competition and volume band, as #rrggbb. */
  colors: BandColors;
  visibleColumns: ColumnKey[];
};

export type InboxSource = "erank" | "extension";

export type InboxRow = { keyword: string; volume: number; competition: number };

/** Keywords the browser extension sent, waiting to be opened in Sort Keyword. */
export type InboxBatch = {
  id: string;
  source: InboxSource;
  /** What the batch is about — usually the eRank search, e.g. "christmas png". */
  label: string;
  createdAt: string;
  rows: InboxRow[];
};

export type NewInboxBatch = { source: InboxSource; label: string; rows: InboxRow[] };

export type StoreData = {
  niches: Niche[];
  keywords: Keyword[];
  settings: Settings;
  inbox: InboxBatch[];
};

/** One set of duplicates to fold together: `keepId` survives, the rest go. */
export type MergeGroup = { keepId: string; mergeIds: string[] };
export type MergeResult = { merged: number; removed: number };

export type NewNiche = { name: string; parentId: string | null };
export type NichePatch = { name?: string; parentId?: string | null };

/** Deleting a parent niche: lift its children one level, or remove the subtree. */
export type NicheDeleteMode = "reparent" | "cascade";

export type NewKeyword = {
  keyword: string;
  volume: number;
  competition: number;
  nicheId: string | null;
  trend?: Trend;
  type?: KeywordType;
};

export type KeywordPatch = {
  keyword?: string;
  volume?: number;
  competition?: number;
  nicheId?: string | null;
  trend?: Trend;
  type?: KeywordType;
  status?: Status;
  tick?: boolean;
};

export type BulkAction =
  | { action: "done" }
  | { action: "pending" }
  | { action: "delete" }
  | { action: "move"; nicheId: string | null };

export type SubnicheOutcome = { name: string; nicheId: string; created: boolean; added: number };

export type ImportResult = {
  added: number;
  skipped: number;
  /** Present when the import sorted keywords into auto-created subniches. */
  subniches?: SubnicheOutcome[];
  /** Keywords that fit no subniche and went into the chosen niche itself. */
  stayed?: number;
  /** Saved keywords whose numbers changed with this import; each got a new reading. */
  updated?: number;
};

export type ImportOptions = {
  /** Sort the rows into subniches of the target niche (see planSubniches). */
  autoSubniches?: { minGroupSize?: number } | null;
};

export type AutoGroupResult = {
  subniches: { name: string; nicheId: string; created: boolean; moved: number }[];
  /** Keywords left directly in the niche. */
  stayed: number;
};

export type NewLicense = { days: number; note: string; maxDevices: number };
export type LicenseAction = "revoke" | "reset-devices";

/**
 * The single seam between the app and its storage.
 *
 * Every read and write in the app goes through this interface, so the backing
 * store (currently a JSON file) can be swapped for SQLite/Prisma or Postgres by
 * writing one new implementation — no route or component changes.
 */
export interface Store {
  /**
   * The workspace — niches, keywords, settings. License records are stored
   * alongside but never returned here: this is what the public /api/data
   * route and the page hand to the browser.
   */
  read(): Promise<StoreData>;

  createLicense(input: NewLicense): Promise<License>;
  listLicenses(): Promise<License[]>;
  updateLicense(key: string, action: LicenseAction): Promise<License>;
  /** Validates a key for one device, claiming a free seat when there is one. */
  checkLicense(key: string, deviceId: string): Promise<LicenseCheck>

  createNiche(input: NewNiche): Promise<Niche>;
  updateNiche(id: string, patch: NichePatch): Promise<Niche>;
  deleteNiche(id: string, mode: NicheDeleteMode): Promise<void>;

  createKeyword(input: NewKeyword): Promise<Keyword>;
  importKeywords(rows: ImportRow[], nicheId: string | null, options?: ImportOptions): Promise<ImportResult>;
  /** Sorts a niche's own keywords into auto-created subniches. */
  autoGroupNiche(nicheId: string, options?: { minGroupSize?: number }): Promise<AutoGroupResult>;
  updateKeyword(id: string, patch: KeywordPatch): Promise<Keyword>;
  bulkKeywords(ids: string[], action: BulkAction): Promise<number>;
  /** Folds each group of duplicate keywords into its kept copy. */
  mergeKeywords(groups: MergeGroup[]): Promise<MergeResult>;

  /** Keywords from the browser extension, held until they are opened in Sort Keyword. */
  addInboxBatch(input: NewInboxBatch): Promise<InboxBatch>;
  removeInboxBatch(id: string): Promise<void>;

  updateSettings(patch: Partial<Settings>): Promise<Settings>;
}

/** Thrown for input the caller could fix; routes map it to a 400. */
export class StoreValidationError extends Error {}
