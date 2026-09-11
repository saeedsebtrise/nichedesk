"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { Check, Circle, Close, Columns, ICONS, Pencil, Plus, Sliders, Trash, TrendUp } from "@/components/marketing/icons";
import { EASE } from "@/components/marketing/motion";
import { NichePickerModal } from "@/components/niches/NichePickerModal";
import { NicheTag, NicheTreeSelect } from "@/components/niches/NicheTree";
import { MovementBadge } from "@/components/ui/Movement";
import { Button, Checkbox, FieldLabel, Select, TextInput } from "@/components/ui/primitives";
import { ScorePill } from "@/components/ui/ScorePill";
import { HistoryModal } from "@/components/work/HistoryModal";
import { KeywordFormModal } from "@/components/work/KeywordFormModal";
import { movementOf } from "@/features/keywords/history";
import { OCCASION_BY_ID, OCCASIONS, detectOccasion, type OccasionId } from "@/features/keywords/occasions";
import { downloadCsv, keywordsToCsv } from "@/features/keywords/export";
import {
  EMPTY_WORK_FILTERS,
  applyWorkFilters,
  sortKeywords,
  type SortDirection,
  type SortKey,
  type StatusFilter,
  type WorkFilters,
} from "@/features/keywords/filters";
import { opportunityScore } from "@/features/keywords/opportunity";
import { TRENDS, TYPES, type Keyword, type KeywordType, type Trend } from "@/features/keywords/types";
import { BAND_CLASS, BAND_ROW_CLASS, competitionBand, type CompetitionRules } from "@/features/settings/competition";
import { requestUpload } from "@/features/workspace/events";
import type { Workspace } from "@/features/workspace/useWorkspace";
import type { ColumnKey } from "@/lib/store/types";
import { cn, formatNumber } from "@/lib/utils";

const SearchIcon = ICONS.search;
const DownloadIcon = ICONS.download;

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "niche", label: "Niche tag" },
  { key: "volume", label: "Volume" },
  { key: "competition", label: "Competition" },
  { key: "tick", label: "Tick" },
  { key: "trend", label: "Trend" },
  { key: "type", label: "Type" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
  { value: "ticked", label: "Ticked" },
];

const RULES = [
  { key: "green", dot: "bg-emerald-600", label: "Below", suffix: "= green" },
  { key: "lightGreen", dot: "bg-emerald-300", label: "Up to", suffix: "= light green" },
  { key: "orange", dot: "bg-amber-400", label: "Up to", suffix: "= orange" },
] as const;

const TH = "px-3 py-3 text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase";
const TD = "px-3 py-2.5";

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function StatTile({ label, value, hint, dot }: { label: string; value: number; hint: string; dot: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">{label}</span>
        <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
      </div>
      <div className="font-display tabular mt-2 text-3xl font-bold text-white">{formatNumber(value)}</div>
      <div className="mt-1 truncate text-xs text-cream-200/45">{hint}</div>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors",
        active ? "text-brand-300" : "text-cream-200/45 hover:text-white",
      )}
    >
      {label}
      {active ? <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span> : null}
    </button>
  );
}

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.28, ease: EASE },
} as const;

export function UpcomingWorkTab({
  workspace,
  filters,
  onFiltersChange,
  onAddKeyword,
}: {
  workspace: Workspace;
  /** Held by the shell, so the sidebar, overview and palette can point this view somewhere. */
  filters: WorkFilters;
  onFiltersChange: (filters: WorkFilters) => void;
  onAddKeyword: () => void;
}) {
  const { keywords, niches, tree, settings } = workspace;

  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<"filters" | "columns" | null>(null);
  const [hideNiche, setHideNiche] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<CompetitionRules>(settings.competitionRules);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [historyOf, setHistoryOf] = useState<Keyword | null>(null);

  const setFilters = (patch: Partial<WorkFilters>) => onFiltersChange({ ...filters, ...patch });
  const visibleColumns = new Set(settings.visibleColumns);

  const rows = useMemo(() => {
    const filtered = applyWorkFilters(keywords, filters, niches);
    return sortKeywords(filtered, sortKey, sortDirection);
  }, [keywords, filters, niches, sortKey, sortDirection]);

  const stats = useMemo(() => {
    const pending = keywords.filter((keyword) => keyword.status === "pending");
    return {
      total: keywords.length,
      pending: pending.length,
      done: keywords.length - pending.length,
      ticked: keywords.filter((keyword) => keyword.tick).length,
      // "Open" means still pending, so this counts the work actually worth doing.
      lowCompetition: pending.filter(
        (keyword) => competitionBand(keyword.competition, settings.competitionRules) === "green",
      ).length,
    };
  }, [keywords, settings.competitionRules]);

  const selectedRows = useMemo(() => rows.filter((keyword) => selected.has(keyword.id)), [rows, selected]);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const advancedCount =
    (filters.minVolume !== "" ? 1 : 0) + (filters.maxCompetition !== "" ? 1 : 0) + (filters.occasion !== "all" ? 1 : 0);
  const activeOccasion = filters.occasion === "all" ? null : OCCASION_BY_ID.get(filters.occasion);
  const filtersActive =
    filters.search !== "" ||
    filters.nicheId !== "all" ||
    filters.status !== "all" ||
    filters.trend !== "all" ||
    filters.type !== "all" ||
    advancedCount > 0;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "keyword" ? "asc" : "desc");
  };

  const ariaSort = (key: SortKey) =>
    key === sortKey ? (sortDirection === "asc" ? "ascending" : "descending") : undefined;

  const toggleColumn = (key: ColumnKey) => {
    const next = visibleColumns.has(key)
      ? settings.visibleColumns.filter((column) => column !== key)
      : [...settings.visibleColumns, key];
    void workspace.saveSettings({ visibleColumns: next });
  };

  const runBulk = async (action: Parameters<Workspace["bulkKeywords"]>[1]) => {
    if (selectedRows.length === 0) return;
    const result = await workspace.bulkKeywords(
      selectedRows.map((keyword) => keyword.id),
      action,
    );
    if (result) setSelected(new Set());
  };

  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePanel = (name: "filters" | "columns") => setPanel((current) => (current === name ? null : name));

  const columnCount = 5 + COLUMNS.filter((column) => column.key !== "niche" && visibleColumns.has(column.key)).length;

  return (
    <div className="space-y-5 pb-24">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total keywords"
          value={stats.total}
          hint={`${formatNumber(stats.ticked)} ticked`}
          dot="bg-cream-200/60"
        />
        <StatTile
          label="Pending"
          value={stats.pending}
          hint={`${percent(stats.pending, stats.total)}% of the list`}
          dot="bg-brand-400"
        />
        <StatTile label="Done" value={stats.done} hint={`${percent(stats.done, stats.total)}% complete`} dot="bg-emerald-400" />
        <StatTile
          label="Low competition (open)"
          value={stats.lowCompetition}
          hint={`under ${formatNumber(settings.competitionRules.green)} competing listings`}
          dot="bg-emerald-600"
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cream-200/40" />
            <TextInput
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              placeholder="Search keywords…"
              aria-label="Search keyword"
              className="pl-9"
            />
          </div>

          <NicheTreeSelect
            tree={tree}
            value={filters.nicheId}
            onChange={(value) => setFilters({ nicheId: value })}
            allLabel="All niches"
            noneLabel="No niche"
            className="max-w-[14rem]"
          />

          <div role="group" aria-label="Status" className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
            {STATUS_OPTIONS.map((option) => {
              const active = filters.status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilters({ status: option.value })}
                  className={cn(
                    "rounded-[0.6rem] px-3 py-1.5 text-xs font-semibold transition-colors",
                    active ? "bg-white/[0.1] text-white shadow-sm" : "text-cream-200/55 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <Select aria-label="Trend" value={filters.trend} onChange={(event) => setFilters({ trend: event.target.value as Trend | "all" })}>
            <option value="all">All trends</option>
            {TRENDS.map((trend) => (
              <option key={trend} value={trend}>
                {trend}
              </option>
            ))}
          </Select>

          <Select aria-label="Type" value={filters.type} onChange={(event) => setFilters({ type: event.target.value as KeywordType | "all" })}>
            <option value="all">All types</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant={panel === "filters" || advancedCount > 0 ? "chipActive" : "chip"}
              aria-expanded={panel === "filters"}
              onClick={() => togglePanel("filters")}
            >
              <Sliders className="size-4" /> Filters &amp; colours
              {advancedCount > 0 ? (
                <span className="rounded-md bg-brand-500 px-1.5 text-[10px] font-bold text-white">{advancedCount}</span>
              ) : null}
            </Button>
            <Button variant={panel === "columns" ? "chipActive" : "chip"} aria-expanded={panel === "columns"} onClick={() => togglePanel("columns")}>
              <Columns className="size-4" /> Columns
            </Button>
            <Button variant="ghost" onClick={() => downloadCsv(keywordsToCsv(rows, niches))} disabled={rows.length === 0}>
              <DownloadIcon className="size-4" /> Export CSV
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {panel === "filters" ? (
            <motion.div key="filters" {...reveal} className="overflow-hidden">
              <div className="grid gap-3 pt-3">
                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-night-950/40 p-3">
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Minimum volume</FieldLabel>
                    <TextInput
                      inputMode="numeric"
                      value={filters.minVolume}
                      onChange={(event) => setFilters({ minVolume: event.target.value })}
                      placeholder="e.g. 500"
                      className="max-w-36"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Maximum competition</FieldLabel>
                    <TextInput
                      inputMode="numeric"
                      value={filters.maxCompetition}
                      onChange={(event) => setFilters({ maxCompetition: event.target.value })}
                      placeholder="e.g. 5000"
                      className="max-w-36"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <FieldLabel>Occasion</FieldLabel>
                    <Select
                      value={filters.occasion}
                      onChange={(event) => setFilters({ occasion: event.target.value as OccasionId | "all" })}
                    >
                      <option value="all">All occasions</option>
                      {OCCASIONS.map((occasion) => (
                        <option key={occasion.id} value={occasion.id}>
                          {occasion.emoji} {occasion.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <Button variant="quiet" onClick={() => setFilters({ minVolume: "", maxCompetition: "", occasion: "all" })}>
                    Clear
                  </Button>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-night-950/40 p-3">
                  <h3 className="text-sm font-semibold text-white">Competition color rules</h3>
                  <p className="mt-0.5 text-xs text-cream-200/50">
                    Set your own cut-offs — competition numbers are coloured by where they fall.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {RULES.map((rule) => (
                      <span
                        key={rule.key}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5"
                      >
                        <span aria-hidden="true" className={cn("size-2.5 rounded-full", rule.dot)} />
                        <span className="text-xs font-semibold whitespace-nowrap text-cream-200/70">{rule.label}</span>
                        <TextInput
                          inputMode="numeric"
                          aria-label={`${rule.label} ${rule.suffix}`}
                          value={String(ruleDraft[rule.key])}
                          onChange={(event) =>
                            setRuleDraft({
                              ...ruleDraft,
                              [rule.key]: Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
                            })
                          }
                          // TextInput is w-full; a max width keeps each rule on one line.
                          className="max-w-24 py-1 text-xs"
                        />
                        <span className="text-xs whitespace-nowrap text-cream-200/45">{rule.suffix}</span>
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-cream-200/50">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-red-500" />
                      Above that = red
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => workspace.saveSettings({ competitionRules: ruleDraft })}
                      disabled={workspace.busy}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {panel === "columns" ? (
            <motion.div key="columns" {...reveal} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <FieldLabel className="mr-1">Show columns</FieldLabel>
                {COLUMNS.map((column) => {
                  const on = visibleColumns.has(column.key);
                  return (
                    <Button
                      key={column.key}
                      variant={on ? "chipActive" : "chip"}
                      aria-pressed={on}
                      onClick={() => toggleColumn(column.key)}
                    >
                      {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                      {column.label}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <p className="text-sm text-cream-200/55">
            Showing <span className="font-semibold text-white">{formatNumber(rows.length)}</span> of{" "}
            {formatNumber(keywords.length)}
          </p>
          {activeOccasion ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 py-1 pr-1 pl-2 text-xs font-semibold text-brand-100">
              {activeOccasion.emoji} {activeOccasion.label}
              <button
                type="button"
                onClick={() => setFilters({ occasion: "all" })}
                aria-label="Clear the occasion filter"
                className="rounded p-0.5 hover:bg-brand-500/25"
              >
                <Close className="size-3" />
              </button>
            </span>
          ) : null}
          {filtersActive ? (
            <Button variant="quiet" className="px-2.5 py-1 text-xs" onClick={() => onFiltersChange(EMPTY_WORK_FILTERS)}>
              Reset filters
            </Button>
          ) : null}
          {visibleColumns.has("niche") ? (
            <button
              type="button"
              onClick={() => setHideNiche((hidden) => !hidden)}
              className="ml-auto text-xs font-semibold text-cream-200/50 transition-colors hover:text-white"
            >
              {hideNiche ? "Show niche tags" : "Hide niche tags"}
            </button>
          ) : null}
        </div>

        <div data-shot="work-table" className="max-h-[72vh] overflow-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#140d09]/95 text-left backdrop-blur">
              <tr className="border-b border-white/[0.08]">
                <th scope="col" className="w-11 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    disabled={rows.length === 0}
                    aria-label="Select all"
                    onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())}
                  />
                </th>
                <th scope="col" className={TH} aria-sort={ariaSort("keyword")}>
                  <SortButton label="Keyword" active={sortKey === "keyword"} direction={sortDirection} onClick={() => toggleSort("keyword")} />
                </th>
                <th scope="col" className={TH} aria-sort={ariaSort("score")}>
                  <SortButton label="Score" active={sortKey === "score"} direction={sortDirection} onClick={() => toggleSort("score")} />
                </th>
                {visibleColumns.has("volume") ? (
                  <th scope="col" className={cn(TH, "text-right")} aria-sort={ariaSort("volume")}>
                    <SortButton label="Volume" active={sortKey === "volume"} direction={sortDirection} onClick={() => toggleSort("volume")} />
                  </th>
                ) : null}
                {visibleColumns.has("competition") ? (
                  <th scope="col" className={TH} aria-sort={ariaSort("competition")}>
                    <SortButton
                      label="Competition"
                      active={sortKey === "competition"}
                      direction={sortDirection}
                      onClick={() => toggleSort("competition")}
                    />
                  </th>
                ) : null}
                {visibleColumns.has("trend") ? (
                  <th scope="col" className={TH}>
                    Trend
                  </th>
                ) : null}
                {visibleColumns.has("type") ? (
                  <th scope="col" className={TH}>
                    Type
                  </th>
                ) : null}
                {visibleColumns.has("tick") ? (
                  <th scope="col" className={TH}>
                    Tick
                  </th>
                ) : null}
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-20 text-center">
                    {keywords.length === 0 ? (
                      <div className="mx-auto max-w-sm">
                        <p className="font-display text-xl font-bold text-white">No keywords yet</p>
                        <p className="mt-2 text-sm text-cream-200/55">Import an eRank CSV, or add a keyword by hand.</p>
                        <div className="mt-5 flex justify-center gap-2">
                          <Button variant="primary" onClick={() => requestUpload()}>
                            Import a CSV
                          </Button>
                          <Button variant="ghost" onClick={onAddKeyword}>
                            Add a keyword
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-sm">
                        <p className="font-display text-xl font-bold text-white">Nothing matches these filters</p>
                        <p className="mt-2 text-sm text-cream-200/55">Loosen a filter, or start again from everything.</p>
                        <Button variant="ghost" className="mt-5" onClick={() => onFiltersChange(EMPTY_WORK_FILTERS)}>
                          Reset filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((keyword) => {
                  const band = competitionBand(keyword.competition, settings.competitionRules);
                  const done = keyword.status === "done";
                  const isSelected = selected.has(keyword.id);
                  const movement = movementOf(keyword);
                  const occasion = detectOccasion(keyword.keyword);
                  const readings = keyword.history?.length ?? 1;

                  return (
                    <tr
                      key={keyword.id}
                      className={cn(
                        "group border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]",
                        isSelected ? "bg-brand-500/[0.08]" : visibleColumns.has("competition") && BAND_ROW_CLASS[band],
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <Checkbox checked={isSelected} aria-label={`Select ${keyword.keyword}`} onChange={() => toggleRow(keyword.id)} />
                      </td>

                      <td className={TD}>
                        <div className={cn("flex min-w-0 flex-wrap items-center gap-2", done && "opacity-55")}>
                          <span className={cn("font-medium text-white", done && "line-through decoration-cream-200/40")}>
                            {keyword.keyword}
                          </span>
                          {visibleColumns.has("niche") && !hideNiche ? <NicheTag niches={niches} nicheId={keyword.nicheId} /> : null}
                          {occasion ? (
                            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-cream-200/65">
                              {occasion.emoji} {occasion.label}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className={TD}>
                        <ScorePill score={opportunityScore(keyword.volume, keyword.competition)} />
                      </td>

                      {visibleColumns.has("volume") ? (
                        <td className={cn(TD, "text-right")}>
                          <span className="inline-flex items-center justify-end gap-1.5">
                            <MovementBadge change={movement?.volume ?? null} goodWhen="up" />
                            <span className="tabular text-cream-200/75">{formatNumber(keyword.volume)}</span>
                          </span>
                        </td>
                      ) : null}

                      {visibleColumns.has("competition") ? (
                        <td className={TD}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn("tabular inline-block rounded-md px-2 py-0.5 text-xs font-bold", BAND_CLASS[band])}>
                              {formatNumber(keyword.competition)}
                            </span>
                            <MovementBadge change={movement?.competition ?? null} goodWhen="down" />
                          </span>
                        </td>
                      ) : null}

                      {visibleColumns.has("trend") ? (
                        <td className={TD}>
                          <Select
                            aria-label={`Trend for ${keyword.keyword}`}
                            value={keyword.trend}
                            className="py-1 text-xs"
                            onChange={(event) => workspace.patchKeyword(keyword.id, { trend: event.target.value as Trend })}
                          >
                            {TRENDS.map((trend) => (
                              <option key={trend} value={trend}>
                                {trend}
                              </option>
                            ))}
                          </Select>
                        </td>
                      ) : null}

                      {visibleColumns.has("type") ? (
                        <td className={TD}>
                          <Select
                            aria-label={`Type for ${keyword.keyword}`}
                            value={keyword.type}
                            className="py-1 text-xs"
                            onChange={(event) => workspace.patchKeyword(keyword.id, { type: event.target.value as KeywordType })}
                          >
                            {TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Select>
                        </td>
                      ) : null}

                      {visibleColumns.has("tick") ? (
                        <td className={TD}>
                          <Checkbox
                            checked={keyword.tick}
                            aria-label={`Tick ${keyword.keyword}`}
                            onChange={(event) => workspace.patchKeyword(keyword.id, { tick: event.target.checked })}
                          />
                        </td>
                      ) : null}

                      <td className={TD}>
                        <button
                          type="button"
                          aria-pressed={done}
                          aria-label={done ? `Mark ${keyword.keyword} as pending` : `Mark ${keyword.keyword} as done`}
                          onClick={() => workspace.patchKeyword(keyword.id, { status: done ? "pending" : "done" })}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors",
                            done
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                              : "border-white/10 text-cream-200/60 hover:border-emerald-400/30 hover:text-emerald-300",
                          )}
                        >
                          {done ? <Check className="size-3.5" strokeWidth={2.6} /> : <Circle className="size-3.5" />}
                          {done ? "Done" : "Pending"}
                        </button>
                      </td>

                      <td className={cn(TD, "text-right")}>
                        <div className="inline-flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => setHistoryOf(keyword)}
                            aria-label={`History of ${keyword.keyword}`}
                            title={readings > 1 ? `${readings} readings` : "History"}
                            className={cn(
                              "rounded-lg p-1.5 transition-colors hover:bg-white/[0.08] hover:text-white",
                              readings > 1 ? "text-brand-300" : "text-cream-200/60",
                            )}
                          >
                            <TrendUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(keyword)}
                            aria-label={`Edit ${keyword.keyword}`}
                            className="rounded-lg p-1.5 text-cream-200/60 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => workspace.deleteKeyword(keyword.id)}
                            aria-label={`Delete ${keyword.keyword}`}
                            className="rounded-lg p-1.5 text-cream-200/60 transition-colors hover:bg-red-500/15 hover:text-red-300"
                          >
                            <Trash className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk actions float over the page while rows are selected. */}
      <AnimatePresence>
        {selectedRows.length > 0 ? (
          <motion.div
            role="toolbar"
            aria-label="Bulk actions"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
            className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-night-900/90 p-2 pl-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:left-[17rem]"
          >
            <span className="mr-1 text-sm font-semibold text-white">
              {formatNumber(selectedRows.length)} selected
            </span>
            <Button variant="ghost" onClick={() => runBulk({ action: "done" })}>
              <Check className="size-4" /> Mark done
            </Button>
            <Button variant="ghost" onClick={() => runBulk({ action: "pending" })}>
              ↺ Mark pending
            </Button>
            <Button variant="outline" onClick={() => setMoveOpen(true)}>
              Move to niche
            </Button>
            <Button variant="danger" onClick={() => runBulk({ action: "delete" })}>
              <Trash className="size-4" /> Delete
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="rounded-lg p-2 text-cream-200/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Close className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <KeywordFormModal open={editing !== null} onClose={() => setEditing(null)} workspace={workspace} keyword={editing} />

      <HistoryModal keyword={historyOf} onClose={() => setHistoryOf(null)} />

      <NichePickerModal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        workspace={workspace}
        title="Move to niche"
        description={`Move ${formatNumber(selectedRows.length)} selected keyword(s) into a niche.`}
        confirmLabel="Move here"
        allowNone
        onConfirm={async (nicheId) => {
          setMoveOpen(false);
          await runBulk({ action: "move", nicheId });
        }}
      />
    </div>
  );
}
