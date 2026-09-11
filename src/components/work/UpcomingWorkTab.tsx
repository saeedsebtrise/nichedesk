"use client";

import { useMemo, useState } from "react";

import { NicheManagerModal } from "@/components/niches/NicheManagerModal";
import { NichePickerModal } from "@/components/niches/NichePickerModal";
import { NicheTag, NicheTreeSelect } from "@/components/niches/NicheTree";
import { KeywordFormModal } from "@/components/work/KeywordFormModal";
import { Banner, Button, Checkbox, FieldLabel, Select, TextInput } from "@/components/ui/primitives";
import { toCsv } from "@/features/keywords/csv";
import {
  EMPTY_WORK_FILTERS,
  applyWorkFilters,
  sortKeywords,
  type SortDirection,
  type SortKey,
  type StatusFilter,
  type WorkFilters,
} from "@/features/keywords/filters";
import {
  TRENDS,
  TYPES,
  type Keyword,
  type KeywordType,
  type Trend,
} from "@/features/keywords/types";
import { nichePathLabel } from "@/features/niches/tree";
import {
  BAND_CLASS,
  BAND_ROW_CLASS,
  competitionBand,
  type CompetitionRules,
} from "@/features/settings/competition";
import type { Workspace } from "@/features/workspace/useWorkspace";
import type { ColumnKey } from "@/lib/store/types";
import { cn, formatNumber } from "@/lib/utils";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "niche", label: "Niche tag" },
  { key: "volume", label: "Volume" },
  { key: "competition", label: "Competition" },
  { key: "tick", label: "Tick" },
  { key: "trend", label: "Trend" },
  { key: "type", label: "Type" },
];

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white/80 px-4 py-3 text-center shadow-sm">
      <div className="tabular text-2xl font-extrabold text-ink-900">{formatNumber(value)}</div>
      <div className="mt-0.5 text-[11px] font-bold tracking-wide text-ink-500 uppercase">{label}</div>
    </div>
  );
}

export function UpcomingWorkTab({ workspace }: { workspace: Workspace }) {
  const { keywords, niches, tree, settings } = workspace;

  const [filters, setFilters] = useState<WorkFilters>(EMPTY_WORK_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [hideNiche, setHideNiche] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<CompetitionRules>(settings.competitionRules);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

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
      // "Open" means still pending, so this counts the work actually worth doing.
      lowCompetition: pending.filter(
        (keyword) => competitionBand(keyword.competition, settings.competitionRules) === "green",
      ).length,
    };
  }, [keywords, settings.competitionRules]);

  const selectedRows = useMemo(
    () => rows.filter((keyword) => selected.has(keyword.id)),
    [rows, selected],
  );
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "keyword" ? "asc" : "desc");
  };

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

  const exportCsv = () => {
    const header = ["Keyword", "Niche", "Volume", "Competition", "Trend", "Type", "Status", "Tick"];
    const csv = toCsv([
      header,
      ...rows.map((keyword) => [
        keyword.keyword,
        nichePathLabel(niches, keyword.nicheId),
        keyword.volume,
        keyword.competition,
        keyword.trend,
        keyword.type,
        keyword.status,
        keyword.tick ? "yes" : "no",
      ]),
    ]);

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nichedesk-keywords-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sortArrow = (key: SortKey) =>
    key === sortKey ? (sortDirection === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total keywords" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile label="Done" value={stats.done} />
        <StatTile label="Low competition (open)" value={stats.lowCompetition} />
      </div>

      {workspace.error ? <Banner tone="error">{workspace.error}</Banner> : null}

      <div className="space-y-3 rounded-2xl border border-cream-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Add keyword manually
          </Button>
          <Button variant="outline" onClick={() => setManagerOpen(true)}>
            + New niche
          </Button>

          <TextInput
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search keyword..."
            aria-label="Search keyword"
            className="max-w-52"
          />

          <NicheTreeSelect
            tree={tree}
            value={filters.nicheId}
            onChange={(value) => setFilters({ ...filters, nicheId: value })}
            allLabel="All niches"
            noneLabel="No niche"
          />

          <Select
            aria-label="Status"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value as StatusFilter })
            }
          >
            <option value="all">All status</option>
            <option value="pending">Pending only</option>
            <option value="done">Done only</option>
            <option value="ticked">Ticked only</option>
          </Select>

          <Select
            aria-label="Trend"
            value={filters.trend}
            onChange={(event) =>
              setFilters({ ...filters, trend: event.target.value as Trend | "all" })
            }
          >
            <option value="all">All trends</option>
            {TRENDS.map((trend) => (
              <option key={trend} value={trend}>
                {trend}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Type"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value as KeywordType | "all" })
            }
          >
            <option value="all">All types</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={exportCsv} disabled={rows.length === 0}>
            ↓ Export CSV
          </Button>
          <Button
            variant="ghost"
            aria-expanded={showColumnPicker}
            onClick={() => setShowColumnPicker((open) => !open)}
          >
            <span aria-hidden="true">🎛</span> Columns ▾
          </Button>
          <span className="ml-auto text-xs text-ink-500">
            Showing {formatNumber(rows.length)} of {formatNumber(keywords.length)}
          </span>
        </div>

        {showColumnPicker ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 p-3">
            <FieldLabel>Show columns:</FieldLabel>
            {COLUMNS.map((column) => {
              const on = visibleColumns.has(column.key);
              return (
                <Button
                  key={column.key}
                  variant={on ? "chipActive" : "chip"}
                  onClick={() => toggleColumn(column.key)}
                  aria-pressed={on}
                >
                  {on ? "✓" : "+"} {column.label}
                </Button>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-cream-200 bg-cream-50 p-3">
          <label className="space-y-1">
            <FieldLabel>Minimum volume</FieldLabel>
            <TextInput
              inputMode="numeric"
              value={filters.minVolume}
              onChange={(event) => setFilters({ ...filters, minVolume: event.target.value })}
              placeholder="e.g. 500"
              className="max-w-36"
            />
          </label>
          <label className="space-y-1">
            <FieldLabel>Maximum competition</FieldLabel>
            <TextInput
              inputMode="numeric"
              value={filters.maxCompetition}
              onChange={(event) => setFilters({ ...filters, maxCompetition: event.target.value })}
              placeholder="e.g. 5000"
              className="max-w-36"
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => setFilters({ ...filters, minVolume: "", maxCompetition: "" })}
          >
            Clear
          </Button>
        </div>

        <div className="rounded-xl border border-cream-200 bg-cream-50 p-3">
          <h3 className="text-sm font-bold text-ink-900">Competition color rules</h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Set your own cut-offs — competition numbers are colored based on where they fall.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(
              [
                { key: "green", dot: "bg-emerald-800", label: "Below", suffix: "= green" },
                { key: "lightGreen", dot: "bg-emerald-300", label: "Up to", suffix: "= light green" },
                { key: "orange", dot: "bg-amber-400", label: "Up to", suffix: "= orange" },
              ] as const
            ).map((rule) => (
              <span
                key={rule.key}
                className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-2.5 py-1.5"
              >
                <span aria-hidden="true" className={cn("size-2.5 rounded-full", rule.dot)} />
                <span className="text-xs font-semibold whitespace-nowrap text-ink-700">
                  {rule.label}
                </span>
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
                  // TextInput is w-full by default; cap it so the labels stay on one line.
                  className="max-w-24 py-1 text-xs"
                />
                <span className="text-xs whitespace-nowrap text-ink-500">{rule.suffix}</span>
              </span>
            ))}
            <span className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-2.5 py-1.5 text-xs text-ink-500">
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

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-200 bg-white p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Checkbox
              checked={allSelected}
              disabled={rows.length === 0}
              onChange={(event) =>
                setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())
              }
            />
            Select all
          </label>
          <span className="text-xs text-ink-500">{formatNumber(selectedRows.length)} selected</span>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="ghost"
              disabled={selectedRows.length === 0}
              onClick={() => runBulk({ action: "done" })}
            >
              ✓ Mark done
            </Button>
            <Button
              variant="ghost"
              disabled={selectedRows.length === 0}
              onClick={() => runBulk({ action: "pending" })}
            >
              ↺ Mark pending
            </Button>
            <Button
              variant="outline"
              disabled={selectedRows.length === 0}
              onClick={() => setMoveOpen(true)}
            >
              ⇄ Move to niche
            </Button>
            <Button
              variant="danger"
              disabled={selectedRows.length === 0}
              onClick={() => runBulk({ action: "delete" })}
            >
              Delete selected
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-cream-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-cream-200 text-left">
              <tr>
                <th scope="col" className="w-10 px-3 py-2">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort("keyword")}
                    className="text-xs font-bold tracking-wide text-ink-700 uppercase hover:text-brand-600"
                  >
                    Keyword{sortArrow("keyword")}
                  </button>
                  {visibleColumns.has("niche") ? (
                    <button
                      type="button"
                      onClick={() => setHideNiche((hidden) => !hidden)}
                      className="ml-2 rounded-full border border-cream-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-500 hover:text-ink-900"
                    >
                      {hideNiche ? "Show niche" : "Hide niche"}
                    </button>
                  ) : null}
                </th>
                {visibleColumns.has("volume") ? (
                  <th scope="col" className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("volume")}
                      className="text-xs font-bold tracking-wide text-ink-700 uppercase hover:text-brand-600"
                    >
                      Volume{sortArrow("volume")}
                    </button>
                  </th>
                ) : null}
                {visibleColumns.has("competition") ? (
                  <th scope="col" className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("competition")}
                      className="text-xs font-bold tracking-wide text-ink-700 uppercase hover:text-brand-600"
                    >
                      Competition{sortArrow("competition")}
                    </button>
                  </th>
                ) : null}
                {visibleColumns.has("trend") ? (
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Trend
                  </th>
                ) : null}
                {visibleColumns.has("type") ? (
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Type
                  </th>
                ) : null}
                {visibleColumns.has("tick") ? (
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Tick
                  </th>
                ) : null}
                <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-sm text-ink-500">
                    {keywords.length === 0
                      ? "No keywords yet — import an eRank CSV from the Sort Keyword tab."
                      : "No keyword matches these filters."}
                  </td>
                </tr>
              ) : (
                rows.map((keyword) => {
                  const band = competitionBand(keyword.competition, settings.competitionRules);

                  return (
                    <tr
                      key={keyword.id}
                      className={cn(
                        visibleColumns.has("competition") ? BAND_ROW_CLASS[band] : undefined,
                        keyword.status === "done" && "opacity-60",
                      )}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(keyword.id)}
                          aria-label={`Select ${keyword.keyword}`}
                          onChange={() =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (next.has(keyword.id)) next.delete(keyword.id);
                              else next.add(keyword.id);
                              return next;
                            })
                          }
                        />
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "font-medium text-ink-900",
                              keyword.status === "done" && "line-through",
                            )}
                          >
                            {keyword.keyword}
                          </span>
                          {visibleColumns.has("niche") && !hideNiche ? (
                            <NicheTag niches={niches} nicheId={keyword.nicheId} />
                          ) : null}
                        </div>
                      </td>

                      {visibleColumns.has("volume") ? (
                        <td className="tabular px-3 py-2 text-ink-700">
                          {formatNumber(keyword.volume)}
                        </td>
                      ) : null}

                      {visibleColumns.has("competition") ? (
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "tabular inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                              BAND_CLASS[band],
                            )}
                          >
                            {formatNumber(keyword.competition)}
                          </span>
                        </td>
                      ) : null}

                      {visibleColumns.has("trend") ? (
                        <td className="px-3 py-2">
                          <Select
                            aria-label={`Trend for ${keyword.keyword}`}
                            value={keyword.trend}
                            className="py-1 text-xs"
                            onChange={(event) =>
                              workspace.patchKeyword(keyword.id, {
                                trend: event.target.value as Trend,
                              })
                            }
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
                        <td className="px-3 py-2">
                          <Select
                            aria-label={`Type for ${keyword.keyword}`}
                            value={keyword.type}
                            className="py-1 text-xs"
                            onChange={(event) =>
                              workspace.patchKeyword(keyword.id, {
                                type: event.target.value as KeywordType,
                              })
                            }
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
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={keyword.tick}
                            aria-label={`Tick ${keyword.keyword}`}
                            onChange={(event) =>
                              workspace.patchKeyword(keyword.id, { tick: event.target.checked })
                            }
                          />
                        </td>
                      ) : null}

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => {
                              setEditing(keyword);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <button
                            type="button"
                            onClick={() => workspace.deleteKeyword(keyword.id)}
                            aria-label={`Delete ${keyword.keyword}`}
                            className="rounded-full px-2 text-ink-500 hover:bg-cream-200 hover:text-red-700"
                          >
                            ×
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

      <KeywordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        workspace={workspace}
        keyword={editing}
      />

      <NicheManagerModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        workspace={workspace}
      />

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
