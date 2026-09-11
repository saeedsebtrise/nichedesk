"use client";

import { useSyncExternalStore } from "react";

/**
 * Time for the browser only. Both hooks return null while the page is
 * server-rendered, so nothing date-dependent can differ between the server's
 * HTML and the first client render.
 */

const noSubscription = () => () => undefined;

/** Today as a UTC day, "2026-09-11". */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscription, () => new Date().toISOString().slice(0, 10), () => null);
}

/** Minutes since the epoch — stable within a minute, which is all "5 min ago" needs. */
export function useNowMinute(): number | null {
  return useSyncExternalStore(noSubscription, () => Math.floor(Date.now() / 60_000), () => null);
}

/** "just now", "12 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string, nowMinute: number): string {
  const minutes = Math.max(0, nowMinute - Math.floor(Date.parse(iso) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
