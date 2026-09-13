"use client";

import type { Lookup } from "./ip";

/**
 * Answers from a lookup route (/api/trademarks, /api/ip-lookup), shared by
 * every table in the tool.
 *
 * Phrases are queued, sent in batches one request at a time, and kept in
 * localStorage for a week, so reopening a CSV costs no new lookups. When a
 * source stops answering, the queue stops rather than keep asking; `retry`
 * starts it again.
 */
export type LookupStore<T> = {
  get: (term: string) => Lookup<T>;
  /** Queues phrases that have no answer yet. */
  request: (terms: Iterable<string>) => void;
  retry: () => void;
  subscribe: (listener: () => void) => () => void;
  version: () => number;
};

type Entry<T> = { at: number; value: T };

export function createLookupStore<T>({
  endpoint,
  storageKey,
  batch = 100,
  keepMs = 7 * 24 * 60 * 60 * 1000,
  keepEntries = 8_000,
}: {
  endpoint: string;
  storageKey: string;
  batch?: number;
  keepMs?: number;
  keepEntries?: number;
}): LookupStore<T> {
  const known = new Map<string, Entry<T>>();
  const queued = new Set<string>();
  const inFlight = new Set<string>();
  const unanswered = new Set<string>();
  const listeners = new Set<() => void>();
  let version = 0;
  let loaded = false;
  let running = false;

  const notify = () => {
    version += 1;
    for (const listener of listeners) listener();
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, Entry<T>>;
      const now = Date.now();
      for (const [term, entry] of Object.entries(stored)) {
        if (entry && typeof entry.at === "number" && now - entry.at < keepMs) known.set(term, entry);
      }
    } catch {
      // Storage blocked or corrupt: start empty.
    }
  };

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries([...known].slice(-keepEntries))));
    } catch {
      // Full or blocked storage only costs repeat lookups.
    }
  };

  const pump = async () => {
    if (running) return;
    running = true;
    try {
      while (queued.size > 0) {
        const terms = [...queued].slice(0, batch);
        for (const term of terms) {
          queued.delete(term);
          inFlight.add(term);
        }
        notify();

        let answered = 0;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ terms }),
          });
          if (!response.ok) throw new Error(`${endpoint} answered ${response.status}`);
          const payload = (await response.json()) as { results: Record<string, T>; failed: string[] };
          const now = Date.now();
          for (const [term, value] of Object.entries(payload.results)) {
            known.set(term, { at: now, value });
            answered += 1;
          }
          for (const term of payload.failed) unanswered.add(term);
          // A phrase the route normalised away still needs an answer, or it would wait forever.
          for (const term of terms) if (!known.has(term)) unanswered.add(term);
        } catch {
          for (const term of terms) unanswered.add(term);
        } finally {
          for (const term of terms) inFlight.delete(term);
          save();
          notify();
        }

        if (answered === 0) break;
      }
    } finally {
      running = false;
    }
  };

  return {
    get: (term) => {
      const entry = known.get(term);
      if (entry) return { state: "done", value: entry.value };
      return unanswered.has(term) ? { state: "failed" } : { state: "pending" };
    },
    request: (terms) => {
      const firstLoad = !loaded;
      load();
      let added = false;
      for (const term of terms) {
        if (!known.has(term) && !inFlight.has(term) && !unanswered.has(term) && !queued.has(term)) {
          queued.add(term);
          added = true;
        }
      }
      if (added) void pump();
      else if (firstLoad) notify();
    },
    retry: () => {
      for (const term of unanswered) queued.add(term);
      unanswered.clear();
      void pump();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    version: () => version,
  };
}
