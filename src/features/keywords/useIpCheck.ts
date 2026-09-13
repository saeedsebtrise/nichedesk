"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { ipResult, ipTerms, trademarkBehind, usptoTermsNeeded, type IpLookups, type IpResult, type IpStatus, type WikiFact } from "./ip";
import { createLookupStore } from "./lookupStore";
import type { TrademarkMark, TrademarkVerdict } from "./trademarks";

const wiki = createLookupStore<WikiFact>({ endpoint: "/api/ip-lookup", storageKey: "nichedesk.wikipedia.v1", batch: 100 });
const uspto = createLookupStore<TrademarkMark[]>({ endpoint: "/api/trademarks", storageKey: "nichedesk.trademarks.v2", batch: 100 });

const lookups: IpLookups = { wiki: wiki.get, uspto: uspto.get };

const subscribe = (listener: () => void) => {
  const stopWiki = wiki.subscribe(listener);
  const stopUspto = uspto.subscribe(listener);
  return () => {
    stopWiki();
    stopUspto();
  };
};
const snapshot = () => wiki.version() * 1_000_000 + uspto.version();

export type IpCounts = Record<IpStatus | "checking", number>;

export type IpCheck = {
  /** The keyword's COPYRIGHT/IP result; undefined while it is still being checked. */
  resultOf: (keyword: string) => IpResult | undefined;
  /** The live USPTO marks behind a YES or POSSIBLE, if any. */
  trademarkOf: (keyword: string) => TrademarkVerdict | null;
  counts: IpCounts;
  retry: () => void;
};

/**
 * Screens every keyword given for third-party IP. The built-in list answers
 * at once; Wikipedia and USPTO answers arrive in the background and update the
 * results as they land.
 */
export function useIpCheck(keywords: string[], enabled = true): IpCheck {
  const version = useSyncExternalStore(subscribe, snapshot, () => 0);

  const unique = useMemo(() => [...new Set(keywords)], [keywords]);

  // Wikipedia first, for every phrase that could be a name.
  useEffect(() => {
    if (!enabled) return;
    wiki.request(unique.flatMap(ipTerms));
  }, [unique, enabled]);

  // Then the USPTO: invented words Wikipedia does not know, and the names behind a YES or POSSIBLE.
  useEffect(() => {
    if (!enabled) return;
    const terms: string[] = [];
    for (const keyword of unique) {
      terms.push(...usptoTermsNeeded(keyword, wiki.get));
      const result = ipResult(keyword, lookups);
      if (result?.matched && (result.status === "yes" || result.status === "possible")) terms.push(result.matched);
    }
    uspto.request(terms);
  }, [unique, enabled, version]);

  const retry = useCallback(() => {
    wiki.retry();
    uspto.retry();
  }, []);

  return useMemo(() => {
    const cache = new Map<string, IpResult | undefined>();
    const resultOf = (keyword: string) => {
      if (!cache.has(keyword)) cache.set(keyword, ipResult(keyword, lookups));
      return cache.get(keyword);
    };

    const counts: IpCounts = { yes: 0, possible: 0, no: 0, unchecked: 0, checking: 0 };
    for (const keyword of unique) {
      const result = resultOf(keyword);
      counts[result ? result.status : "checking"] += 1;
    }

    return {
      resultOf,
      trademarkOf: (keyword: string) => trademarkBehind(resultOf(keyword), uspto.get),
      counts,
      retry,
    };
    // `version` changes whenever an answer lands; the stores it stands for live outside React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, unique, retry]);
}
