"use client";

import { useMemo, useState } from "react";

import { useToday } from "@/components/app/clock";
import { ArrowRight, Check } from "@/components/marketing/icons";
import { Button, Checkbox } from "@/components/ui/primitives";
import { ScorePill } from "@/components/ui/ScorePill";
import type { WorkFilters } from "@/features/keywords/filters";
import {
  countByOccasion,
  daysBetween,
  formatDay,
  groupByOccasion,
  seasonRows,
  type OccasionPhase,
  type SeasonRow,
} from "@/features/keywords/occasions";
import { opportunityScore } from "@/features/keywords/opportunity";
import type { Keyword } from "@/features/keywords/types";
import { ColorBadge } from "@/components/ui/ColorBadge";
import { competitionColor, volumeColor, type ColorSettings } from "@/features/settings/colors";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

export const PHASE: Record<OccasionPhase, { label: string; className: string; hint: string }> = {
  selling: {
    label: "Selling now",
    className: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
    hint: "Buyers are searching — make sure these listings are live.",
  },
  make: {
    label: "Make & list now",
    className: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
    hint: "The best time to design and list, before buyers arrive.",
  },
  soon: {
    label: "Coming up",
    className: "bg-amber-400/15 text-amber-200 ring-amber-400/25",
    hint: "Their making window opens within six weeks.",
  },
  later: {
    label: "Later",
    className: "bg-white/[0.06] text-cream-200/55 ring-white/10",
    hint: "",
  },
};

/** Most urgent first: selling, then making, then what starts soon. */
const URGENCY: Record<OccasionPhase, number> = { selling: 0, make: 1, soon: 2, later: 3 };

/** Keywords listed per occasion before "Show all". */
const SHOWN = 5;

/** One short line on what to do for an occasion right now, starting date first. */
export function phaseDetail(row: SeasonRow, today: Date): string {
  if (row.phase === "selling") {
    return `Buyers searching · ${daysBetween(today, row.window.date)} days to ${formatDay(row.window.date)}`;
  }
  if (row.phase === "make") return `Start now · buyers from ${formatDay(row.window.peakFrom)}`;
  return `Start ${formatDay(row.window.makeFrom)} · in ${daysBetween(today, row.window.makeFrom)} days`;
}

/** The headline of an occasion's plan: when to start work, in plain words. */
function startAdvice(row: SeasonRow, today: Date): string {
  const { makeFrom, peakFrom, date } = row.window;
  if (row.phase === "selling") {
    return `List these now — buyers are already searching, and it is ${daysBetween(today, date)} days to ${row.occasion.label}.`;
  }
  if (row.phase === "make") {
    return `Start work now — the making window opened ${formatDay(makeFrom)}, and buyers start searching ${formatDay(peakFrom)}.`;
  }
  return `Start work on ${formatDay(makeFrom)} — that is in ${daysBetween(today, makeFrom)} days.`;
}

/** Pending before done; the best opportunities first within each. */
const bestFirst = (a: Keyword, b: Keyword) => {
  if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
  return opportunityScore(b.volume, b.competition) - opportunityScore(a.volume, a.competition);
};

/** One occasion's plan: when to start, its three dates, and the keywords to make for it. */
function OccasionPlan({
  row,
  today,
  keywords,
  colors,
  onOpenWork,
}: {
  row: SeasonRow;
  today: Date;
  keywords: Keyword[];
  colors: ColorSettings;
  onOpenWork: (patch: Partial<WorkFilters>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => [...keywords].sort(bestFirst), [keywords]);
  const shown = expanded ? sorted : sorted.slice(0, SHOWN);

  const { makeFrom, peakFrom, date } = row.window;
  const span = date.getTime() - makeFrom.getTime();
  const peakAt = ((peakFrom.getTime() - makeFrom.getTime()) / span) * 100;
  const started = today.getTime() >= makeFrom.getTime();
  const todayAt = Math.min(100, Math.max(0, ((today.getTime() - makeFrom.getTime()) / span) * 100));

  return (
    <article
      aria-labelledby={`plan-${row.occasion.id}`}
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border bg-white/[0.025] p-5",
        row.phase === "selling" || row.phase === "make" ? "border-brand-500/25" : "border-white/[0.08]",
      )}
    >
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl leading-none">
          {row.occasion.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`plan-${row.occasion.id}`} className="font-display text-lg font-bold tracking-tight text-white">
              {row.occasion.label}
            </h3>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1", PHASE[row.phase].className)}>
              {PHASE[row.phase].label}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-cream-100/85">{startAdvice(row, today)}</p>
        </div>
        <span className="shrink-0 text-right text-xs text-cream-200/50 tabular-nums">
          {formatNumber(row.pending)} pending
          <br />
          {formatNumber(row.total - row.pending)} done
        </span>
      </header>

      {/* The three dates on one line, with where today falls between them. */}
      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-white/[0.06]">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 rounded-l-full border border-dashed border-brand-400/60 bg-brand-500/20"
            style={{ width: `${peakAt}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-r from-brand-500 to-amber-300"
            style={{ left: `${peakAt}%` }}
          />
          {started ? (
            <span
              title="Today"
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-night-950 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
              style={{ left: `${todayAt}%` }}
            />
          ) : null}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-cream-200/45">Start work</dt>
            <dd className="font-semibold text-white">{formatDay(makeFrom)}</dd>
          </div>
          <div className="text-center">
            <dt className="text-cream-200/45">Buyers search</dt>
            <dd className="font-semibold text-white">{formatDay(peakFrom)}</dd>
          </div>
          <div className="text-right">
            <dt className="text-cream-200/45">{row.occasion.label}</dt>
            <dd className="font-semibold text-white">{formatDay(date)}</dd>
          </div>
        </dl>
      </div>

      <ul className="mt-5 divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.06] bg-night-950/30">
        {shown.map((keyword) => {
          const done = keyword.status === "done";
          return (
            <li key={keyword.id}>
              <button
                type="button"
                onClick={() => onOpenWork({ search: keyword.keyword })}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border",
                    done ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300" : "border-white/20",
                  )}
                >
                  {done ? <Check className="size-2.5" strokeWidth={3} /> : null}
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-sm", done ? "text-cream-200/40 line-through" : "text-white")}>
                  {keyword.keyword}
                  <span className="sr-only">{done ? " (done)" : " (pending)"}</span>
                </span>
                <span className="hidden items-center gap-1 text-xs text-cream-200/50 sm:flex">
                  vol
                  <ColorBadge size="sm" color={volumeColor(keyword.volume, colors)}>
                    {formatNumber(keyword.volume)}
                  </ColorBadge>
                </span>
                <ColorBadge size="sm" color={competitionColor(keyword.competition, colors)}>
                  {formatNumber(keyword.competition)}
                </ColorBadge>
                <ScorePill score={opportunityScore(keyword.volume, keyword.competition)} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        {sorted.length > SHOWN ? (
          <Button variant="quiet" className="px-2.5 py-1 text-xs" onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Show fewer" : `Show all ${formatNumber(sorted.length)}`}
          </Button>
        ) : (
          <span />
        )}
        <Button variant="chip" className="px-2.5 py-1 text-xs" onClick={() => onOpenWork({ occasion: row.occasion.id })}>
          Open in Upcoming Work <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}

/**
 * The seasonal planner: what to make now and what is selling now, a plan per
 * occasion — when to start and which keywords to make — and a year-long
 * timeline. Keywords are matched to occasions by their words, so nothing
 * needs tagging.
 */
export function CalendarTab({
  workspace,
  onOpenWork,
}: {
  workspace: Workspace;
  onOpenWork: (patch: Partial<WorkFilters>) => void;
}) {
  const todayKey = useToday();
  const [onlyMine, setOnlyMine] = useState(false);

  const groups = useMemo(() => groupByOccasion(workspace.keywords), [workspace.keywords]);
  const counts = useMemo(() => countByOccasion(workspace.keywords), [workspace.keywords]);
  const today = useMemo(() => (todayKey ? new Date(`${todayKey}T12:00:00Z`) : null), [todayKey]);
  const rows = useMemo(() => (today ? seasonRows(today, counts) : []), [today, counts]);

  if (!today) return null;

  // A rolling year from the first of this month.
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 12, 1);
  const at = (date: Date) => Math.min(100, Math.max(0, ((date.getTime() - start) / (end - start)) * 100));
  const months = Array.from(
    { length: 12 },
    (_, index) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + index, 1)),
  );

  const visible = onlyMine ? rows.filter((row) => row.total > 0) : rows;
  const inPhase = (phase: OccasionPhase) => rows.filter((row) => row.phase === phase);
  const open = (row: SeasonRow) => onOpenWork({ occasion: row.occasion.id });

  const planned = rows
    .filter((row) => row.total > 0)
    .sort((a, b) => URGENCY[a.phase] - URGENCY[b.phase] || a.window.makeFrom.getTime() - b.window.makeFrom.getTime());
  const seasonal = [...groups.values()].reduce((sum, group) => sum + group.length, 0);
  const evergreen = workspace.keywords.length - seasonal;

  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-500/[0.12] via-white/[0.02] to-transparent p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.28),transparent)] blur-2xl"
        />
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-300 uppercase">Season calendar</p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })} —{" "}
          {inPhase("make").length} occasion{inPhase("make").length === 1 ? "" : "s"} to make for, {inPhase("selling").length}{" "}
          selling now
        </h2>
        <p className="mt-2 max-w-2xl text-cream-200/60">
          Etsy buyers shop weeks before a holiday, so listings need to be live before then. Keywords are matched to occasions by
          their words — “christmas gnome png” counts for Christmas.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {(["selling", "make", "soon"] as const).map((phase) => (
          <section key={phase} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1", PHASE[phase].className)}>
              {PHASE[phase].label}
            </p>
            <p className="mt-2 text-sm text-cream-200/55">{PHASE[phase].hint}</p>
            <ul className="mt-4 space-y-2">
              {inPhase(phase).length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-sm text-cream-200/40">
                  Nothing right now
                </li>
              ) : (
                inPhase(phase).map((row) => (
                  <li key={row.occasion.id}>
                    <button
                      type="button"
                      disabled={row.total === 0}
                      onClick={() => open(row)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-colors enabled:hover:border-white/15 enabled:hover:bg-white/[0.05] disabled:cursor-default"
                    >
                      <span aria-hidden="true" className="text-xl">
                        {row.occasion.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-white">{row.occasion.label}</span>
                        <span className="block text-xs text-cream-200/50">{phaseDetail(row, today)}</span>
                      </span>
                      <span className="text-xs text-cream-200/60 tabular-nums">
                        {row.total > 0 ? `${formatNumber(row.pending)} pending` : "no keywords yet"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>

      <section aria-labelledby="plan-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="plan-title" className="font-display text-lg font-bold tracking-tight text-white">
              Your keywords, by occasion
            </h2>
            <p className="mt-0.5 text-sm text-cream-200/50">When to start work on each, and what to make — most urgent first</p>
          </div>
          {evergreen > 0 ? (
            <p className="text-xs text-cream-200/45">
              {formatNumber(evergreen)} keyword{evergreen === 1 ? " has" : "s have"} no occasion — they sell all year.
            </p>
          ) : null}
        </div>

        {planned.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-cream-200/50">
            None of your keywords is for an occasion yet. Seasonal keywords — “christmas”, “halloween”, “valentine”… — show up
            here with the date to start work on them.
          </p>
        ) : (
          // grid-cols-1 + min-w-0 on each card: otherwise a long keyword row stretches a card past a phone's edge.
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {planned.map((row) => (
              <OccasionPlan
                key={row.occasion.id}
                row={row}
                today={today}
                keywords={groups.get(row.occasion.id) ?? []}
                colors={workspace.settings}
                onOpenWork={onOpenWork}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">The year ahead</h2>
            <p className="mt-0.5 text-sm text-cream-200/50">When to make, and when buyers search, for every occasion</p>
          </div>
          <ul className="flex flex-wrap items-center gap-4 text-xs text-cream-200/60">
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full border border-dashed border-brand-400/60 bg-brand-500/15" /> Make &amp; list
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-amber-300" /> Buyers searching
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full border-2 border-night-950 bg-white" /> The day
            </li>
          </ul>
          <label className="ml-auto flex items-center gap-2 text-sm text-cream-200/70">
            <Checkbox checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />
            Only occasions I have keywords for
          </label>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[52rem]">
            <div className="grid grid-cols-[15rem_1fr]">
              <span />
              <div className="relative grid grid-cols-12 border-b border-white/[0.08] pb-2 text-[11px] font-medium text-cream-200/45">
                {months.map((month) => (
                  <span key={month.toISOString()} className="pl-1.5">
                    {month.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
                    {month.getUTCMonth() === 0 ? ` ’${String(month.getUTCFullYear()).slice(2)}` : ""}
                  </span>
                ))}
                <span
                  className="absolute -top-1 -translate-x-1/2 rounded bg-brand-500 px-1.5 text-[10px] font-bold text-white"
                  style={{ left: `${at(today)}%` }}
                >
                  Today
                </span>
              </div>
            </div>

            <ul>
              {visible.map((row) => (
                <li
                  key={row.occasion.id}
                  className={cn(
                    "grid grid-cols-[15rem_1fr] items-center border-b border-white/[0.05]",
                    row.total === 0 && "opacity-45",
                  )}
                >
                  <button
                    type="button"
                    disabled={row.total === 0}
                    onClick={() => open(row)}
                    className="flex min-w-0 items-center gap-2.5 py-2.5 pr-3 text-left disabled:cursor-default"
                  >
                    <span aria-hidden="true" className="text-lg">
                      {row.occasion.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{row.occasion.label}</span>
                      <span className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-cream-200/45">
                        {row.phase === "later" ? (
                          <span>Start {formatDay(row.window.makeFrom)}</span>
                        ) : (
                          <span className={cn("rounded px-1 font-semibold ring-1", PHASE[row.phase].className)}>
                            {row.phase === "soon" ? `Start ${formatDay(row.window.makeFrom)}` : PHASE[row.phase].label}
                          </span>
                        )}
                        {row.total > 0 ? `· ${formatNumber(row.pending)} pending` : "· no keywords"}
                      </span>
                    </span>
                  </button>

                  <div
                    className="relative h-10"
                    title={`Start work ${formatDay(row.window.makeFrom)} · buyers from ${formatDay(row.window.peakFrom)} · ${formatDay(row.window.date)}`}
                  >
                    <div aria-hidden="true" className="absolute inset-0 grid grid-cols-12">
                      {months.map((month, index) => (
                        <span
                          key={month.toISOString()}
                          className={cn("border-l", index === 0 ? "border-transparent" : "border-white/[0.04]")}
                        />
                      ))}
                    </div>
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 w-px bg-brand-400/60"
                      style={{ left: `${at(today)}%` }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-l-full border border-dashed border-brand-400/60 bg-brand-500/15"
                      style={{
                        left: `${at(row.window.makeFrom)}%`,
                        width: `${Math.max(0, at(row.window.peakFrom) - at(row.window.makeFrom))}%`,
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-r-full bg-gradient-to-r from-brand-500 to-amber-300 shadow-[0_0_14px_-2px_rgba(244,103,31,0.7)]"
                      style={{
                        left: `${at(row.window.peakFrom)}%`,
                        width: `${Math.max(0, at(row.window.date) - at(row.window.peakFrom))}%`,
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-night-950 bg-white"
                      style={{ left: `${at(row.window.date)}%` }}
                    />
                    <span className="sr-only">
                      Start work {formatDay(row.window.makeFrom)}, buyers search from {formatDay(row.window.peakFrom)}, on{" "}
                      {formatDay(row.window.date)}.
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
