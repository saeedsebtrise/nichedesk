import { randomUUID } from "node:crypto";

import { DEFAULT_COMPETITION_RULES, normalizeRules } from "@/features/settings/competition";
import {
  evaluateLicense,
  generateLicenseKey,
  normalizeLicenseKey,
  touchDevice,
  type License,
  type LicenseCheck,
} from "@/features/licenses/licenses";
import { planSubniches } from "@/features/niches/auto-group";
import { canReparent, withDescendantIds } from "@/features/niches/tree";
import { MAX_SNAPSHOTS, recordSnapshot, snapshotsOf } from "@/features/keywords/history";
import { TRENDS, TYPES } from "@/features/keywords/types";
import type { ImportRow, Keyword, Snapshot } from "@/features/keywords/types";
import type { Niche } from "@/features/niches/types";
import {
  StoreValidationError,
  type AutoGroupResult,
  type BulkAction,
  type ColumnKey,
  type ImportOptions,
  type ImportResult,
  type InboxBatch,
  type SubnicheOutcome,
  type KeywordPatch,
  type LicenseAction,
  type MergeGroup,
  type MergeResult,
  type NewInboxBatch,
  type NewKeyword,
  type NewLicense,
  type NewNiche,
  type NicheDeleteMode,
  type NichePatch,
  type Settings,
  type Store,
  type StoreData,
} from "./types";

const DEFAULT_COLUMNS: ColumnKey[] = ["niche", "volume", "competition", "tick"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Extension batches waiting in the inbox; older ones drop off. */
export const MAX_INBOX_BATCHES = 20;

export const emptyWorkspace = (): StoreData => ({
  niches: [],
  keywords: [],
  settings: {
    competitionRules: { ...DEFAULT_COMPETITION_RULES },
    visibleColumns: [...DEFAULT_COLUMNS],
  },
  inbox: [],
});

const isSnapshot = (value: unknown): value is Snapshot => {
  const reading = value as Snapshot | null;
  return (
    typeof reading?.at === "string" && Number.isFinite(reading.volume) && Number.isFinite(reading.competition)
  );
};

/** Normalises a stored workspace, dropping shapes that would crash the app. */
export function coerceWorkspace(raw: unknown): StoreData {
  if (typeof raw !== "object" || raw === null) return emptyWorkspace();

  const data = raw as Partial<StoreData>;

  const niches = Array.isArray(data.niches)
    ? data.niches.filter((n): n is Niche => typeof n?.id === "string" && typeof n?.name === "string")
    : [];

  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter(
        (k): k is Keyword => typeof k?.id === "string" && typeof k?.keyword === "string",
      )
    : [];

  const inbox = Array.isArray(data.inbox)
    ? data.inbox
        .filter((batch): batch is InboxBatch => typeof batch?.id === "string" && Array.isArray(batch?.rows))
        .slice(0, MAX_INBOX_BATCHES)
        .map((batch) => ({
          id: batch.id,
          source: batch.source === "extension" ? ("extension" as const) : ("erank" as const),
          label: typeof batch.label === "string" ? batch.label : "",
          createdAt: typeof batch.createdAt === "string" ? batch.createdAt : new Date(0).toISOString(),
          rows: batch.rows
            .filter((row) => typeof row?.keyword === "string")
            .map((row) => ({
              keyword: row.keyword,
              volume: Number.isFinite(row.volume) ? row.volume : 0,
              competition: Number.isFinite(row.competition) ? row.competition : 0,
            })),
        }))
    : [];

  return {
    niches: niches.map((n) => ({ ...n, parentId: n.parentId ?? null })),
    keywords: keywords.map(({ history, ...k }) => {
      const readings = Array.isArray(history) ? history.filter(isSnapshot).slice(-MAX_SNAPSHOTS) : [];
      return {
        ...k,
        volume: Number.isFinite(k.volume) ? k.volume : 0,
        competition: Number.isFinite(k.competition) ? k.competition : 0,
        nicheId: k.nicheId ?? null,
        trend: TRENDS.includes(k.trend) ? k.trend : "Evergreen",
        type: TYPES.includes(k.type) ? k.type : "White hat",
        status: k.status === "done" ? "done" : "pending",
        tick: Boolean(k.tick),
        ...(readings.length > 0 ? { history: readings } : {}),
      };
    }),
    settings: {
      competitionRules: normalizeRules({
        ...DEFAULT_COMPETITION_RULES,
        ...(data.settings?.competitionRules ?? {}),
      }),
      visibleColumns: Array.isArray(data.settings?.visibleColumns)
        ? data.settings.visibleColumns
        : [...DEFAULT_COLUMNS],
    },
    inbox,
  };
}

/** Normalises a stored license list. */
export function coerceLicenses(raw: unknown): License[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is License => typeof l?.key === "string" && typeof l?.expiresAt === "string")
    .map((l) => ({
      ...l,
      note: typeof l.note === "string" ? l.note : "",
      revokedAt: l.revokedAt ?? null,
      maxDevices: Number.isInteger(l.maxDevices) && l.maxDevices > 0 ? l.maxDevices : 1,
      devices: Array.isArray(l.devices) ? l.devices : [],
    }));
}

const trimmed = (value: string, field: string): string => {
  const text = value.trim();
  if (text === "") throw new StoreValidationError(field + " cannot be empty.");
  return text;
};

const wholeNumber = (value: number): number => Math.max(0, Math.round(value) || 0);

/**
 * Every business rule of the store, written once against two JSON documents:
 * the workspace (niches, keywords, settings) and the license list.
 *
 * A backend only supplies atomic load/update of those two documents — the
 * JSON file for local use, Postgres when deployed — so both behave exactly
 * alike. `mutate` callbacks must be synchronous and free of side effects: a
 * backend may run one again on a fresh copy if another write landed first.
 */
export abstract class DocumentStore implements Store {
  protected abstract loadWorkspace(): Promise<StoreData>;
  protected abstract updateWorkspace<T>(mutate: (data: StoreData) => T): Promise<T>;
  protected abstract loadLicenses(): Promise<License[]>;
  protected abstract updateLicenses<T>(mutate: (licenses: License[]) => T): Promise<T>;

  read(): Promise<StoreData> {
    return this.loadWorkspace();
  }

  private requireNiche(data: StoreData, id: string | null): string | null {
    if (id === null) return null;
    if (!data.niches.some((niche) => niche.id === id)) {
      throw new StoreValidationError("That niche no longer exists.");
    }
    return id;
  }

  createNiche(input: NewNiche): Promise<Niche> {
    return this.updateWorkspace((data) => {
      const name = trimmed(input.name, "Niche name");
      const parentId = this.requireNiche(data, input.parentId ?? null);

      const duplicate = data.niches.some(
        (niche) => niche.parentId === parentId && niche.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        throw new StoreValidationError(
          parentId ? "That subniche already exists under this parent." : "That niche already exists.",
        );
      }

      const niche: Niche = { id: randomUUID(), name, parentId, createdAt: new Date().toISOString() };
      data.niches.push(niche);
      return niche;
    });
  }

  updateNiche(id: string, patch: NichePatch): Promise<Niche> {
    return this.updateWorkspace((data) => {
      const niche = data.niches.find((candidate) => candidate.id === id);
      if (!niche) throw new StoreValidationError("That niche no longer exists.");

      if (patch.parentId !== undefined) {
        const parentId = this.requireNiche(data, patch.parentId);
        if (!canReparent(data.niches, id, parentId)) {
          throw new StoreValidationError("A niche cannot be moved inside itself.");
        }
        niche.parentId = parentId;
      }

      if (patch.name !== undefined) niche.name = trimmed(patch.name, "Niche name");

      return niche;
    });
  }

  deleteNiche(id: string, mode: NicheDeleteMode): Promise<void> {
    return this.updateWorkspace((data) => {
      const niche = data.niches.find((candidate) => candidate.id === id);
      if (!niche) throw new StoreValidationError("That niche no longer exists.");

      if (mode === "cascade") {
        const doomed = withDescendantIds(data.niches, id);
        data.niches = data.niches.filter((candidate) => !doomed.has(candidate.id));
        data.keywords = data.keywords.filter(
          (keyword) => keyword.nicheId === null || !doomed.has(keyword.nicheId),
        );
        return;
      }

      // Lift the children a level so a subtree is never orphaned by a delete.
      for (const child of data.niches) {
        if (child.parentId === id) child.parentId = niche.parentId;
      }
      for (const keyword of data.keywords) {
        if (keyword.nicheId === id) keyword.nicheId = niche.parentId;
      }
      data.niches = data.niches.filter((candidate) => candidate.id !== id);
    });
  }

  createKeyword(input: NewKeyword): Promise<Keyword> {
    return this.updateWorkspace((data) => {
      const createdAt = new Date().toISOString();
      const volume = wholeNumber(input.volume);
      const competition = wholeNumber(input.competition);
      const keyword: Keyword = {
        id: randomUUID(),
        keyword: trimmed(input.keyword, "Keyword"),
        volume,
        competition,
        nicheId: this.requireNiche(data, input.nicheId),
        trend: input.trend ?? "Evergreen",
        type: input.type ?? "White hat",
        status: "pending",
        tick: false,
        createdAt,
        history: [{ at: createdAt, volume, competition }],
      };

      data.keywords.push(keyword);
      return keyword;
    });
  }

  /** The child of `parentId` called `name` (any case), created if it is missing. */
  private ensureChild(data: StoreData, parentId: string, name: string): { niche: Niche; created: boolean } {
    const existing = data.niches.find(
      (niche) => niche.parentId === parentId && niche.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return { niche: existing, created: false };

    const niche: Niche = { id: randomUUID(), name, parentId, createdAt: new Date().toISOString() };
    data.niches.push(niche);
    return { niche, created: true };
  }

  /**
   * Adds rows to one niche. Re-importing the same eRank export is routine, so
   * keywords the niche already holds are skipped rather than duplicated.
   *
   * A re-import still carries news, though: every saved copy of a search term,
   * in whichever niche, takes the fresh numbers and gains a history reading,
   * which is what lets the desk show a keyword rising or getting crowded.
   */
  private addRows(data: StoreData, nicheId: string | null, rows: ImportRow[]): ImportResult {
    const now = new Date().toISOString();
    const inNiche = new Set(
      data.keywords
        .filter((keyword) => keyword.nicheId === nicheId)
        .map((keyword) => keyword.keyword.toLowerCase()),
    );
    const saved = new Map<string, Keyword[]>();
    for (const keyword of data.keywords) {
      const key = keyword.keyword.toLowerCase();
      saved.set(key, [...(saved.get(key) ?? []), keyword]);
    }

    let added = 0;
    let skipped = 0;
    let updated = 0;
    const refreshed = new Set<string>();

    for (const row of rows) {
      const name = row.keyword.trim();
      if (name === "") continue;

      const key = name.toLowerCase();
      const reading: Snapshot = {
        at: now,
        volume: wholeNumber(row.volume),
        competition: wholeNumber(row.competition),
      };

      if (!refreshed.has(key)) {
        refreshed.add(key);
        for (const keyword of saved.get(key) ?? []) {
          if (keyword.volume !== reading.volume || keyword.competition !== reading.competition) updated += 1;
          keyword.history = recordSnapshot(snapshotsOf(keyword), reading);
          keyword.volume = reading.volume;
          keyword.competition = reading.competition;
        }
      }

      if (inNiche.has(key)) {
        skipped += 1;
        continue;
      }
      inNiche.add(key);

      // A copy in another niche already has a past; the new one shares it.
      const sibling = saved.get(key)?.[0];
      const keyword: Keyword = {
        id: randomUUID(),
        keyword: name,
        volume: reading.volume,
        competition: reading.competition,
        nicheId,
        trend: "Evergreen",
        type: "White hat",
        status: "pending",
        tick: false,
        createdAt: now,
        history: sibling ? [...snapshotsOf(sibling)] : [reading],
      };
      data.keywords.push(keyword);
      saved.set(key, [...(saved.get(key) ?? []), keyword]);
      added += 1;
    }

    return updated > 0 ? { added, skipped, updated } : { added, skipped };
  }

  importKeywords(rows: ImportRow[], nicheId: string | null, options: ImportOptions = {}): Promise<ImportResult> {
    return this.updateWorkspace((data) => {
      const target = this.requireNiche(data, nicheId);
      if (!options.autoSubniches || target === null) return this.addRows(data, target, rows);

      const parent = data.niches.find((niche) => niche.id === target) as Niche;
      const clean = rows.filter((row) => row.keyword.trim() !== "");
      const plan = planSubniches(
        clean.map((row) => row.keyword),
        parent.name,
        { minGroupSize: options.autoSubniches.minGroupSize },
      );

      let added = 0;
      let skipped = 0;
      let updated = 0;
      const subniches: SubnicheOutcome[] = [];

      for (const group of plan.groups) {
        const { niche, created } = this.ensureChild(data, target, group.name);
        const result = this.addRows(data, niche.id, group.members.map((index) => clean[index]));
        added += result.added;
        skipped += result.skipped;
        updated += result.updated ?? 0;
        subniches.push({ name: niche.name, nicheId: niche.id, created, added: result.added });
      }

      const rest = this.addRows(data, target, plan.rest.map((index) => clean[index]));
      updated += rest.updated ?? 0;
      return {
        added: added + rest.added,
        skipped: skipped + rest.skipped,
        subniches,
        stayed: rest.added,
        ...(updated > 0 ? { updated } : {}),
      };
    });
  }

  autoGroupNiche(nicheId: string, options: { minGroupSize?: number } = {}): Promise<AutoGroupResult> {
    return this.updateWorkspace((data) => {
      const parent = data.niches.find((niche) => niche.id === nicheId);
      if (!parent) throw new StoreValidationError("That niche no longer exists.");

      const own = data.keywords.filter((keyword) => keyword.nicheId === nicheId);
      const plan = planSubniches(
        own.map((keyword) => keyword.keyword),
        parent.name,
        options,
      );
      let stayed = plan.rest.length;

      const subniches = plan.groups.map((group) => {
        const { niche, created } = this.ensureChild(data, nicheId, group.name);
        const held = new Set(
          data.keywords
            .filter((keyword) => keyword.nicheId === niche.id)
            .map((keyword) => keyword.keyword.toLowerCase()),
        );

        let moved = 0;
        for (const index of group.members) {
          const keyword = own[index];
          // The subniche already has this keyword: moving would duplicate it,
          // and deleting would lose this copy's status, so it stays put.
          if (held.has(keyword.keyword.toLowerCase())) {
            stayed += 1;
            continue;
          }
          keyword.nicheId = niche.id;
          held.add(keyword.keyword.toLowerCase());
          moved += 1;
        }

        return { name: niche.name, nicheId: niche.id, created, moved };
      });

      return { subniches, stayed };
    });
  }

  updateKeyword(id: string, patch: KeywordPatch): Promise<Keyword> {
    return this.updateWorkspace((data) => {
      const keyword = data.keywords.find((candidate) => candidate.id === id);
      if (!keyword) throw new StoreValidationError("That keyword no longer exists.");

      if (patch.keyword !== undefined) keyword.keyword = trimmed(patch.keyword, "Keyword");
      const volume = patch.volume !== undefined ? wholeNumber(patch.volume) : keyword.volume;
      const competition = patch.competition !== undefined ? wholeNumber(patch.competition) : keyword.competition;
      if (volume !== keyword.volume || competition !== keyword.competition) {
        // A figure corrected by hand is a reading too, so the history keeps up.
        keyword.history = recordSnapshot(snapshotsOf(keyword), { at: new Date().toISOString(), volume, competition });
        keyword.volume = volume;
        keyword.competition = competition;
      }
      if (patch.nicheId !== undefined) keyword.nicheId = this.requireNiche(data, patch.nicheId);
      if (patch.trend !== undefined) keyword.trend = patch.trend;
      if (patch.type !== undefined) keyword.type = patch.type;
      if (patch.status !== undefined) keyword.status = patch.status;
      if (patch.tick !== undefined) keyword.tick = patch.tick;

      return keyword;
    });
  }

  bulkKeywords(ids: string[], action: BulkAction): Promise<number> {
    return this.updateWorkspace((data) => {
      const targets = new Set(ids);

      if (action.action === "delete") {
        const before = data.keywords.length;
        data.keywords = data.keywords.filter((keyword) => !targets.has(keyword.id));
        return before - data.keywords.length;
      }

      const nicheId = action.action === "move" ? this.requireNiche(data, action.nicheId) : null;
      let changed = 0;

      for (const keyword of data.keywords) {
        if (!targets.has(keyword.id)) continue;

        if (action.action === "move") keyword.nicheId = nicheId;
        else keyword.status = action.action;

        changed += 1;
      }

      return changed;
    });
  }

  /**
   * Folds duplicates into one kept copy per group. The kept copy inherits what
   * the others knew — a tick, or work already done — and keeps its own niche
   * and numbers; the others are removed.
   */
  mergeKeywords(groups: MergeGroup[]): Promise<MergeResult> {
    return this.updateWorkspace((data) => {
      const byId = new Map(data.keywords.map((keyword) => [keyword.id, keyword]));
      const doomed = new Set<string>();
      let merged = 0;

      for (const group of groups) {
        const keep = byId.get(group.keepId);
        if (!keep) throw new StoreValidationError("A keyword to keep no longer exists.");
        if (doomed.has(keep.id)) continue;

        const others = group.mergeIds
          .filter((id) => id !== keep.id && !doomed.has(id))
          .map((id) => byId.get(id))
          .filter((keyword): keyword is Keyword => keyword !== undefined);
        if (others.length === 0) continue;

        keep.tick = keep.tick || others.some((keyword) => keyword.tick);
        if (others.some((keyword) => keyword.status === "done")) keep.status = "done";
        for (const other of others) doomed.add(other.id);
        merged += 1;
      }

      data.keywords = data.keywords.filter((keyword) => !doomed.has(keyword.id));
      return { merged, removed: doomed.size };
    });
  }

  addInboxBatch(input: NewInboxBatch): Promise<InboxBatch> {
    return this.updateWorkspace((data) => {
      const seen = new Set<string>();
      const rows: InboxBatch["rows"] = [];
      for (const row of input.rows) {
        const keyword = row.keyword.trim();
        const key = keyword.toLowerCase();
        if (keyword === "" || seen.has(key)) continue;
        seen.add(key);
        rows.push({ keyword, volume: wholeNumber(row.volume), competition: wholeNumber(row.competition) });
      }
      if (rows.length === 0) throw new StoreValidationError("There are no keywords to send.");

      const batch: InboxBatch = {
        id: randomUUID(),
        source: input.source,
        label: input.label.trim() || "eRank keywords",
        createdAt: new Date().toISOString(),
        rows,
      };
      data.inbox = [batch, ...data.inbox].slice(0, MAX_INBOX_BATCHES);
      return batch;
    });
  }

  removeInboxBatch(id: string): Promise<void> {
    return this.updateWorkspace((data) => {
      data.inbox = data.inbox.filter((batch) => batch.id !== id);
    });
  }

  updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return this.updateWorkspace((data) => {
      if (patch.competitionRules) {
        data.settings.competitionRules = normalizeRules(patch.competitionRules);
      }
      if (patch.visibleColumns) {
        data.settings.visibleColumns = patch.visibleColumns;
      }
      return data.settings;
    });
  }

  createLicense(input: NewLicense): Promise<License> {
    return this.updateLicenses((licenses) => {
      const taken = new Set(licenses.map((license) => license.key));
      let key = generateLicenseKey();
      // 60 random bits make a clash vanishingly rare, but it costs nothing to rule out.
      while (taken.has(key)) key = generateLicenseKey();

      const now = new Date();
      const license: License = {
        key,
        note: input.note.trim(),
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + input.days * DAY_MS).toISOString(),
        revokedAt: null,
        maxDevices: input.maxDevices,
        devices: [],
      };

      licenses.push(license);
      return license;
    });
  }

  async listLicenses(): Promise<License[]> {
    const licenses = await this.loadLicenses();
    return [...licenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updateLicense(key: string, action: LicenseAction): Promise<License> {
    return this.updateLicenses((licenses) => {
      const normalized = normalizeLicenseKey(key);
      const license = licenses.find((candidate) => candidate.key === normalized);
      if (!license) throw new StoreValidationError("No license with that key.");

      if (action === "revoke") license.revokedAt ??= new Date().toISOString();
      if (action === "reset-devices") license.devices = [];

      return license;
    });
  }

  checkLicense(key: string, deviceId: string): Promise<LicenseCheck> {
    return this.updateLicenses((licenses) => {
      const normalized = normalizeLicenseKey(key);
      const license = normalized ? licenses.find((candidate) => candidate.key === normalized) : undefined;

      const now = new Date();
      const result = evaluateLicense(license, deviceId, now);
      if (license && result.valid) touchDevice(license, deviceId, now);

      return result;
    });
  }
}
