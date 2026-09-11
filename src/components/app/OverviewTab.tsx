"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { ArrowRight, Flame, ICONS, Plus } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { NicheTag } from "@/components/niches/NicheTree";
import { Button } from "@/components/ui/primitives";
import { ScorePill } from "@/components/ui/ScorePill";
import type { WorkFilters } from "@/features/keywords/filters";
import { opportunityScore } from "@/features/keywords/opportunity";
import { TRENDS, TYPES } from "@/features/keywords/types";
import { withDescendantIds } from "@/features/niches/tree";
import { BAND_CLASS, competitionBand, type CompetitionBand } from "@/features/settings/competition";
import { requestUpload } from "@/features/workspace/events";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

const UploadIcon = ICONS.upload;
const TreeIcon = ICONS.tree;

const BANDS: { band: CompetitionBand; label: string; bar: string }[] = [
  { band: "green", label: "Low", bar: "bg-emerald-600" },
  { band: "lightGreen", label: "Moderate", bar: "bg-emerald-300" },
  { band: "orange", label: "High", bar: "bg-amber-400" },
  { band: "red", label: "Very high", bar: "bg-red-500" },
];

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-cream-200/50">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const share = total > 0 ? done / total : 0;
  return (
    <div className="relative size-24 shrink-0 sm:size-32">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="overview-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc59b" />
            <stop offset="1" stopColor="#f4671f" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#overview-ring)"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: share }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{ filter: "drop-shadow(0 0 10px rgba(244,103,31,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-2xl font-bold text-white sm:text-3xl">{percent(done, total)}%</span>
        <span className="text-[11px] font-medium text-cream-200/50">done</span>
      </div>
    </div>
  );
}

function Welcome({ onAddKeyword }: { onAddKeyword: () => void }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center sm:px-12 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 h-80 w-[50rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.28),transparent)] blur-2xl"
      />
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-3xl font-black text-white shadow-[0_0_70px_-8px_rgba(244,103,31,0.95),inset_0_1px_0_rgba(255,255,255,0.4)]">
        N
      </div>
      <h2 className="font-display mx-auto mt-7 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Welcome to your keyword desk
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-cream-200/60">
        Bring in an eRank export and NicheDesk turns it into a niche tree you can work through — scored, colour-coded
        and tracked from pending to done.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="primary" className="px-6 py-3" onClick={() => requestUpload()}>
          <UploadIcon className="size-4" /> Import an eRank CSV
        </Button>
        <Button variant="ghost" className="px-6 py-3" onClick={onAddKeyword}>
          <Plus className="size-4" /> Add a keyword by hand
        </Button>
      </div>
      <p className="mt-5 text-xs text-cream-200/40">Tip: you can also drop a CSV anywhere on this page.</p>
    </section>
  );
}

export function OverviewTab({
  workspace,
  onOpenWork,
  onAddKeyword,
  onManageNiches,
}: {
  workspace: Workspace;
  /** Opens Upcoming Work with these filters applied. */
  onOpenWork: (patch: Partial<WorkFilters>) => void;
  onAddKeyword: () => void;
  onManageNiches: () => void;
}) {
  const { keywords, niches, tree, settings } = workspace;
  const rules = settings.competitionRules;

  const stats = useMemo(() => {
    const bands: Record<CompetitionBand, number> = { green: 0, lightGreen: 0, orange: 0, red: 0 };
    let done = 0;
    let ticked = 0;
    let lowOpen = 0;
    let scoreSum = 0;
    for (const keyword of keywords) {
      const band = competitionBand(keyword.competition, rules);
      bands[band] += 1;
      if (keyword.status === "done") done += 1;
      else if (band === "green") lowOpen += 1;
      if (keyword.tick) ticked += 1;
      scoreSum += opportunityScore(keyword.volume, keyword.competition);
    }

    const best = keywords
      .filter((keyword) => keyword.status === "pending")
      .map((keyword) => ({ keyword, score: opportunityScore(keyword.volume, keyword.competition) }))
      .sort((a, b) => b.score - a.score || b.keyword.volume - a.keyword.volume)
      .slice(0, 6);

    return {
      total: keywords.length,
      done,
      pending: keywords.length - done,
      ticked,
      lowOpen,
      bands,
      best,
      avgScore: keywords.length > 0 ? Math.round(scoreSum / keywords.length) : 0,
      trends: TRENDS.map((trend) => ({ label: trend, count: keywords.filter((keyword) => keyword.trend === trend).length })),
      types: TYPES.map((type) => ({ label: type, count: keywords.filter((keyword) => keyword.type === type).length })),
    };
  }, [keywords, rules]);

  const nicheRows = useMemo(
    () =>
      tree
        .map((node) => {
          const ids = withDescendantIds(niches, node.id);
          const inside = keywords.filter((keyword) => keyword.nicheId !== null && ids.has(keyword.nicheId));
          return {
            id: node.id,
            name: node.name,
            subniches: ids.size - 1,
            total: inside.length,
            done: inside.filter((keyword) => keyword.status === "done").length,
            low: inside.filter(
              (keyword) => keyword.status === "pending" && competitionBand(keyword.competition, rules) === "green",
            ).length,
          };
        })
        .sort((a, b) => b.total - a.total),
    [tree, niches, keywords, rules],
  );

  if (keywords.length === 0) return <Welcome onAddKeyword={onAddKeyword} />;

  const tiles = [
    { label: "Total keywords", value: stats.total, hint: `${niches.length} niche${niches.length === 1 ? "" : "s"}`, go: {} },
    { label: "Pending", value: stats.pending, hint: `${percent(stats.pending, stats.total)}% still to do`, go: { status: "pending" } },
    { label: "Done", value: stats.done, hint: `${percent(stats.done, stats.total)}% complete`, go: { status: "done" } },
    {
      label: "Low competition",
      value: stats.lowOpen,
      hint: `open, under ${formatNumber(rules.green)}`,
      go: { status: "pending", maxCompetition: String(Math.max(0, rules.green - 1)) },
    },
    { label: "Ticked", value: stats.ticked, hint: "marked to make", go: { status: "ticked" } },
  ] satisfies { label: string; value: number; hint: string; go: Partial<WorkFilters> }[];

  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-500/[0.13] via-white/[0.02] to-transparent p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.3),transparent)] blur-2xl"
        />
        {/* Stacked on phones, side by side from small tablets up. */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ProgressRing done={stats.done} total={stats.total} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-300 uppercase">Your keyword desk</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              {formatNumber(stats.pending)} keyword{stats.pending === 1 ? "" : "s"} waiting across {formatNumber(niches.length)}{" "}
              niche{niches.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-cream-200/60">
              {formatNumber(stats.done)} done so far · {formatNumber(stats.lowOpen)} low-competition keywords still open ·
              average opportunity score {stats.avgScore}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onOpenWork({ status: "pending" })}>
                Open the work queue <ArrowRight className="size-4" />
              </Button>
              <Button variant="ghost" onClick={() => requestUpload()}>
                <UploadIcon className="size-4" /> Import a CSV
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => onOpenWork(tile.go)}
            className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
          >
            <span className="flex items-center justify-between text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">
              {tile.label}
              <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            <span className="font-display tabular mt-2 block text-3xl font-bold text-white">{formatNumber(tile.value)}</span>
            <span className="mt-1 block truncate text-xs text-cream-200/45">{tile.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Best opportunities"
          description="Pending keywords with the most searches per competing listing"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              <Flame className="size-3.5" /> Opportunity score
            </span>
          }
        >
          {stats.best.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-cream-200/50">
              Everything is done — nothing pending to rank.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {stats.best.map(({ keyword, score }, index) => (
                <li key={keyword.id}>
                  <button
                    type="button"
                    onClick={() => onOpenWork({ search: keyword.keyword })}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <span className="font-display w-5 shrink-0 text-sm font-bold text-cream-200/35">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-white">{keyword.keyword}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-cream-200/45">
                        <NicheTag niches={niches} nicheId={keyword.nicheId} />
                        <span className="tabular">vol {formatNumber(keyword.volume)}</span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "tabular hidden rounded-md px-2 py-0.5 text-xs font-bold sm:inline-block",
                        BAND_CLASS[competitionBand(keyword.competition, rules)],
                      )}
                    >
                      {formatNumber(keyword.competition)}
                    </span>
                    <ScorePill score={score} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Competition mix" description="Where your keywords fall against your colour cut-offs">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
              {BANDS.map(({ band, bar }) => (
                <motion.span
                  key={band}
                  className={cn("h-full", bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent(stats.bands[band], stats.total)}%` }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {BANDS.map(({ band, label, bar }) => (
                <li key={band} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-full", bar)} />
                  <span className="text-cream-200/65">{label}</span>
                  <span className="tabular ml-auto font-semibold text-white">{formatNumber(stats.bands[band])}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Trend & type" description="How you have labelled what you saved">
            <div className="space-y-4">
              {[stats.trends, stats.types].map((group, index) => (
                <ul key={index} className="space-y-2">
                  {group.map((item) => (
                    <li key={item.label} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
                      <span className="text-cream-200/65">{item.label}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-300"
                          style={{ width: `${percent(item.count, stats.total)}%` }}
                        />
                      </span>
                      <span className="tabular w-10 text-right font-semibold text-white">{formatNumber(item.count)}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Niches"
        description="Progress through each top-level niche, subniches included"
        action={
          <Button variant="chip" onClick={onManageNiches}>
            <TreeIcon className="size-4" /> Manage niches
          </Button>
        }
      >
        {nicheRows.length === 0 ? (
          <button
            type="button"
            onClick={onManageNiches}
            className="w-full rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-cream-200/55 transition-colors hover:border-brand-500/40 hover:text-white"
          >
            No niches yet — create your first one
          </button>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2">
            {nicheRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onOpenWork({ nicheId: row.id })}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold text-white">{row.name}</span>
                    {row.subniches > 0 ? (
                      <span className="shrink-0 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-cream-200/55">
                        {row.subniches} sub
                      </span>
                    ) : null}
                    <span className="tabular ml-auto shrink-0 text-xs text-cream-200/50">
                      {formatNumber(row.done)} / {formatNumber(row.total)} done
                    </span>
                  </span>
                  <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-300"
                      style={{ width: `${percent(row.done, row.total)}%` }}
                    />
                  </span>
                  <span className="mt-2 block text-xs text-cream-200/45">
                    {formatNumber(row.low)} low-competition keyword{row.low === 1 ? "" : "s"} open
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
