"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { trademarkTerms, trademarkVerdict, type TrademarkMark, type TrademarkVerdict } from "./trademarks";

/**
 * Trademark answers shared by every table in the tool.
 *
 * Phrases are sent to /api/trademarks in batches, one batch at a time, and
 * each answer is kept in localStorage for a week — reopening a CSV costs no
 * new searches.
 */
const STORAGE_KEY = "nichedesk.trademarks.v1";
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const KEEP_ENTRIES = 8_000;
const BATCH = 100;

type Entry = { at: number; marks: TrademarkMark[] };

const known = new Map<string, Entry>();
const queued = new Set<string>();
const inFlight = new Set<string>();
/** Phrases the USPTO did not answer; they wait for a retry. */
const unanswered = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
let loaded = false;
let running = false;

const notify = () => {
  version += 1;
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Entry>;
    const now = Date.now();
    for (const [term, entry] of Object.entries(stored)) {
      if (Array.isArray(entry?.marks) && now - entry.at < KEEP_MS) known.set(term, entry);
    }
  } catch {
    // Storage blocked or corrupt: start empty.
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries([...known].slice(-KEEP_ENTRIES))));
  } catch {
    // Full or blocked storage only costs repeat searches.
  }
}

async function pump() {
  if (running) return;
  running = true;
  try {
    while (queued.size > 0) {
      const batch = [...queued].slice(0, BATCH);
      for (const term of batch) {
        queued.delete(term);
        inFlight.add(term);
      }
      notify();

      let answered = 0;
      try {
        const response = await fetch("/api/trademarks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ terms: batch }),
        });
        if (!response.ok) throw new Error(`Trademark check failed (${response.status})`);
        const payload = (await response.json()) as { results: Record<string, TrademarkMark[]>; failed: string[] };
        const now = Date.now();
        for (const [term, marks] of Object.entries(payload.results)) {
          known.set(term, { at: now, marks });
          answered += 1;
        }
        for (const term of payload.failed) unanswered.add(term);
      } catch {
        for (const term of batch) unanswered.add(term);
      } finally {
        for (const term of batch) inFlight.delete(term);
        save();
        notify();
      }

      // The USPTO is not answering: stop until the user retries, rather than keep asking.
      if (answered === 0) break;
    }
  } finally {
    running = false;
  }
}

export type TrademarkCheck = {
  /** A verdict when the keyword matched a live mark, null when clear, undefined while unchecked. */
  verdictOf: (keyword: string) => TrademarkVerdict | null | undefined;
  /** Phrases still waiting for an answer. */
  checking: number;
  /** Phrases the USPTO did not answer. */
  unanswered: number;
  retry: () => void;
};

/** Checks every keyword given (skipping ones already known) and reports what the USPTO says. */
export function useTrademarks(keywords: string[], enabled = true): TrademarkCheck {
  const current = useSyncExternalStore(subscribe, () => version, () => 0);

  const terms = useMemo(() => {
    const all = new Set<string>();
    for (const keyword of keywords) for (const term of trademarkTerms(keyword)) all.add(term);
    return all;
  }, [keywords]);

  useEffect(() => {
    if (!enabled) return;
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
  }, [terms, enabled]);

  const retry = useCallback(() => {
    for (const term of unanswered) queued.add(term);
    unanswered.clear();
    void pump();
  }, []);

  return useMemo(() => {
    let checking = 0;
    let failed = 0;
    for (const term of terms) {
      if (queued.has(term) || inFlight.has(term)) checking += 1;
      else if (unanswered.has(term)) failed += 1;
    }
    return {
      verdictOf: (keyword: string) => trademarkVerdict(keyword, (term) => known.get(term)?.marks),
      checking,
      unanswered: failed,
      retry,
    };
    // `current` changes whenever an answer arrives; the maps it stands for are module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, terms, retry]);
}
