"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { buildTree, nichePathLabel } from "@/features/niches/tree";
import type { ImportRow, Keyword } from "@/features/keywords/types";
import type { Niche } from "@/features/niches/types";
import type {
  AutoGroupResult,
  BulkAction,
  ImportResult,
  KeywordPatch,
  NicheDeleteMode,
  Settings,
  StoreData,
} from "@/lib/store/types";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error ?? "That request failed.");
  }
  return payload as T;
}

const body = (value: unknown) => JSON.stringify(value);

/**
 * Holds the whole workspace client-side and funnels every mutation through the
 * API routes.
 *
 * Mutations refetch the dataset so the UI always matches the store, except
 * per-row edits (trend, type, tick) which apply locally first — those fire on
 * every dropdown change and a full refetch each time would make the table feel
 * sluggish. A failed edit resyncs from the server.
 */
export function useWorkspace(initial: StoreData) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Mirrors `data` for code that runs after an await.
   *
   * A callback that creates a niche and then wants its name would otherwise read
   * the `niches` array captured when the callback was created — i.e. before the
   * new niche existed.
   */
  const latest = useRef(data);
  const store = useCallback((next: StoreData) => {
    latest.current = next;
    setData(next);
  }, []);

  const refresh = useCallback(async () => {
    store(await call<StoreData>("/api/data"));
  }, [store]);

  /** Runs a mutation with the busy flag and a single place for error reporting. */
  const run = useCallback(
    async <T>(work: () => Promise<T>, { resync = true } = {}): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        const result = await work();
        if (resync) await refresh();
        return result;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
        if (!resync) await refresh().catch(() => undefined);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const actions = useMemo(
    () => ({
      createNiche: (name: string, parentId: string | null) =>
        run(() => call<Niche>("/api/niches", { method: "POST", body: body({ name, parentId }) })),

      renameNiche: (id: string, name: string) =>
        run(() => call<Niche>(`/api/niches/${id}`, { method: "PATCH", body: body({ name }) })),

      moveNiche: (id: string, parentId: string | null) =>
        run(() => call<Niche>(`/api/niches/${id}`, { method: "PATCH", body: body({ parentId }) })),

      deleteNiche: (id: string, mode: NicheDeleteMode) =>
        run(() => call(`/api/niches/${id}?mode=${mode}`, { method: "DELETE" })),

      addKeyword: (input: {
        keyword: string;
        volume: number;
        competition: number;
        nicheId: string | null;
      }) => run(() => call<Keyword>("/api/keywords", { method: "POST", body: body(input) })),

      importKeywords: (
        rows: ImportRow[],
        nicheId: string | null,
        autoSubniches: { minGroupSize: number } | null = null,
      ) =>
        run(() =>
          call<ImportResult>("/api/keywords/import", {
            method: "POST",
            body: body({ rows, nicheId, autoSubniches }),
          }),
        ),

      autoGroupNiche: (id: string, minGroupSize: number) =>
        run(() =>
          call<AutoGroupResult>(`/api/niches/${id}/auto-group`, {
            method: "POST",
            body: body({ minGroupSize }),
          }),
        ),

      /** Optimistic: the row updates immediately, the server confirms after. */
      patchKeyword: (id: string, patch: KeywordPatch) => {
        store({
          ...latest.current,
          keywords: latest.current.keywords.map((keyword) =>
            keyword.id === id ? { ...keyword, ...patch } : keyword,
          ),
        });

        return run(
          () => call<Keyword>(`/api/keywords/${id}`, { method: "PATCH", body: body(patch) }),
          { resync: false },
        );
      },

      deleteKeyword: (id: string) => run(() => call(`/api/keywords/${id}`, { method: "DELETE" })),

      bulkKeywords: (ids: string[], action: BulkAction) =>
        run(() =>
          call<{ changed: number }>("/api/keywords/bulk", {
            method: "POST",
            body: body({ ids, action }),
          }),
        ),

      saveSettings: (patch: Partial<Settings>) =>
        run(() => call<Settings>("/api/settings", { method: "PATCH", body: body(patch) })),

      /** `parent › child` label read from the freshest data, safe after an await. */
      labelFor: (nicheId: string | null) => nichePathLabel(latest.current.niches, nicheId),
    }),
    [run, store],
  );

  const tree = useMemo(() => buildTree(data.niches), [data.niches]);

  return {
    niches: data.niches,
    keywords: data.keywords,
    settings: data.settings,
    tree,
    busy,
    error,
    clearError: () => setError(null),
    refresh,
    ...actions,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
