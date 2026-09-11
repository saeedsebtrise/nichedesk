"use client";

import { useMemo, useRef, useState } from "react";

import { NichePickerModal, type AutoSubniches } from "@/components/niches/NichePickerModal";
import { Banner, Button, Checkbox, TextInput } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { parseErankCsv } from "@/features/keywords/csv";
import {
  EMPTY_IMPORT_FILTERS,
  applyImportFilters,
  type ImportFilters,
} from "@/features/keywords/filters";
import type { ImportRow } from "@/features/keywords/types";
import { BAND_CLASS, competitionBand } from "@/features/settings/competition";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

/** How many preview rows to mount at once; more are appended while scrolling. */
const PAGE_SIZE = 200;

type FilterKey = "including" | "excluding" | "volume" | "competition";

const FILTER_META: Record<FilterKey, { chip: string; icon: string }> = {
  including: { chip: "Including", icon: "🔍" },
  excluding: { chip: "Excluding", icon: "🚫" },
  volume: { chip: "Volume", icon: "📊" },
  competition: { chip: "Competition", icon: "⚔️" },
};

/** Chip summary for an active filter, e.g. `Including: "png"`. */
function chipSummary(key: FilterKey, filters: ImportFilters): string | null {
  if (key === "including" && filters.including.trim() !== "") {
    return `Including: “${filters.including.trim()}”`;
  }
  if (key === "excluding" && filters.excluding.trim() !== "") {
    return `Excluding: “${filters.excluding.trim()}”`;
  }
  if (key === "volume" && (filters.minVolume !== "" || filters.maxVolume !== "")) {
    return `Volume: ${filters.minVolume || "0"} – ${filters.maxVolume || "∞"}`;
  }
  if (key === "competition" && (filters.minCompetition !== "" || filters.maxCompetition !== "")) {
    return `Competition: ${filters.minCompetition || "0"} – ${filters.maxCompetition || "∞"}`;
  }
  return null;
}

export function SortKeywordTab({ workspace }: { workspace: Workspace }) {
  const { settings } = workspace;

  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFilters] = useState<ImportFilters>(EMPTY_IMPORT_FILTERS);
  const [openFilters, setOpenFilters] = useState<FilterKey[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => applyImportFilters(rows, filters), [rows, filters]);
  const visibleRows = filtered.slice(0, visibleCount);

  // Selection survives filter changes, so only count what is currently matched.
  const selectedInView = useMemo(
    () => filtered.filter((row) => selected.has(row.id)),
    [filtered, selected],
  );
  const allMatchingSelected = filtered.length > 0 && selectedInView.length === filtered.length;

  // What "Add to a niche" saves: the selected rows, or every match if none are selected.
  const targetRows = selectedInView.length > 0 ? selectedInView : filtered;
  const previewKeywords = useMemo(() => targetRows.map((row) => row.keyword), [targetRows]);

  const loadFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast({ tone: "error", title: "Could not read that file", detail: file.name });
      return;
    }
    const { rows: parsed, warnings: parseWarnings } = parseErankCsv(text);

    setRows(parsed);
    setFileName(file.name);
    setWarnings(parseWarnings);
    setFilters(EMPTY_IMPORT_FILTERS);
    setOpenFilters([]);
    setSelected(new Set());
    setVisibleCount(PAGE_SIZE);

    if (parsed.length === 0) {
      toast({
        tone: "error",
        title: "No keywords found",
        detail: parseWarnings[0] ?? `${file.name} has no keyword rows.`,
      });
      return;
    }
    toast({
      tone: "success",
      title: "File uploaded successfully",
      detail: `${file.name} · ${formatNumber(parsed.length)} keyword${parsed.length === 1 ? "" : "s"} loaded`,
    });
  };

  const toggleFilter = (key: FilterKey) => {
    setOpenFilters((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const removeFilter = (key: FilterKey) => {
    setOpenFilters((current) => current.filter((item) => item !== key));
    setFilters((current) => ({
      ...current,
      ...(key === "including" ? { including: "" } : {}),
      ...(key === "excluding" ? { excluding: "" } : {}),
      ...(key === "volume" ? { minVolume: "", maxVolume: "" } : {}),
      ...(key === "competition" ? { minCompetition: "", maxCompetition: "" } : {}),
    }));
  };

  const clearAll = () => {
    setFilters(EMPTY_IMPORT_FILTERS);
    setOpenFilters([]);
  };

  const toggleRow = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dropRows = (ids: string[]) => {
    const doomed = new Set(ids);
    setRows((current) => current.filter((row) => !doomed.has(row.id)));
    setSelected((current) => {
      const next = new Set(current);
      for (const id of doomed) next.delete(id);
      return next;
    });
  };

  const addToNiche = async (nicheId: string | null, autoSubniches: AutoSubniches) => {
    const payload = targetRows;
    const result = await workspace.importKeywords(payload, nicheId, autoSubniches);
    setPickerOpen(false);

    if (!result) return;

    // Read the label after the save: a niche created in the dialog moments ago
    // is not in this callback's captured `niches`.
    const where = nicheId ? workspace.labelFor(nicheId) : "no niche";
    const subniches = result.subniches ?? [];
    const created = subniches.filter((subniche) => subniche.created).length;
    const details = [
      subniches.length > 0
        ? `Sorted into ${subniches.length} subniche${subniches.length === 1 ? "" : "s"}` +
          (created < subniches.length ? ` (${created} new)` : "") +
          `; ${formatNumber(result.stayed ?? 0)} stayed in ${where}`
        : null,
      result.skipped > 0 ? `${formatNumber(result.skipped)} skipped — already there` : null,
    ].filter(Boolean);
    toast({
      tone: "success",
      title: `${formatNumber(result.added)} keyword${result.added === 1 ? "" : "s"} added to “${where}”`,
      detail: details.join(" · ") || undefined,
    });

    // Saved rows leave the preview so a second click cannot re-add them.
    dropRows(payload.map((row) => row.id));
  };

  const discard = () => {
    setRows([]);
    setFileName(null);
    setWarnings([]);
    setSelected(new Set());
    clearAll();
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cream-200 bg-white/80 p-4 shadow-sm">
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
        />
        <Button variant="primary" onClick={() => fileInput.current?.click()}>
          <span aria-hidden="true">📥</span> Upload eRank CSV
        </Button>
        <p className="text-sm text-ink-700">
          Upload a CSV, filter it below, then select rows and send them to Upcoming Work.
        </p>
        {fileName ? (
          <span className="ml-auto truncate rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-ink-700">
            {fileName}
          </span>
        ) : null}
      </div>

      {workspace.error ? <Banner tone="error">{workspace.error}</Banner> : null}
      {warnings.map((warning) => (
        <Banner key={warning} tone="info">
          {warning}
        </Banner>
      ))}

      <div className="space-y-3 rounded-2xl border-2 border-dashed border-brand-300 bg-white/60 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <span aria-hidden="true" className="text-brand-500">
              ●
            </span>
            Import Preview — {formatNumber(rows.length)} keyword(s), not saved yet
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Set your filters below, select the rows you want, then choose a bulk action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(FILTER_META) as FilterKey[]).map((key) => {
            const summary = chipSummary(key, filters);
            const active = summary !== null;
            const open = openFilters.includes(key);

            return (
              <span key={key} className="inline-flex items-center">
                <Button
                  variant={active ? "chipActive" : "chip"}
                  aria-expanded={open}
                  onClick={() => toggleFilter(key)}
                  className={active ? "rounded-r-none pr-2" : undefined}
                >
                  <span aria-hidden="true">{FILTER_META[key].icon}</span>
                  {summary ?? `+ ${FILTER_META[key].chip}...`}
                </Button>
                {active ? (
                  <button
                    type="button"
                    onClick={() => removeFilter(key)}
                    aria-label={`Remove ${FILTER_META[key].chip} filter`}
                    className="rounded-r-full bg-brand-500 py-2 pr-3 pl-1 text-sm font-bold text-white hover:bg-brand-600"
                  >
                    ×
                  </button>
                ) : null}
              </span>
            );
          })}

          <Button variant="ghost" onClick={clearAll}>
            Clear all
          </Button>
        </div>

        {openFilters.length > 0 ? (
          <div className="grid gap-3 rounded-xl border border-cream-200 bg-cream-50 p-3 sm:grid-cols-2">
            {openFilters.includes("including") ? (
              <label className="space-y-1 text-xs font-semibold text-ink-700">
                Including (comma-separated, any match)
                <TextInput
                  value={filters.including}
                  onChange={(event) => setFilters({ ...filters, including: event.target.value })}
                  placeholder="png, svg"
                />
              </label>
            ) : null}

            {openFilters.includes("excluding") ? (
              <label className="space-y-1 text-xs font-semibold text-ink-700">
                Excluding (comma-separated)
                <TextInput
                  value={filters.excluding}
                  onChange={(event) => setFilters({ ...filters, excluding: event.target.value })}
                  placeholder="free, bundle"
                />
              </label>
            ) : null}

            {openFilters.includes("volume") ? (
              <div className="space-y-1 text-xs font-semibold text-ink-700">
                Volume range
                <div className="flex items-center gap-2">
                  <TextInput
                    inputMode="numeric"
                    value={filters.minVolume}
                    onChange={(event) => setFilters({ ...filters, minVolume: event.target.value })}
                    placeholder="min"
                    aria-label="Minimum volume"
                  />
                  <TextInput
                    inputMode="numeric"
                    value={filters.maxVolume}
                    onChange={(event) => setFilters({ ...filters, maxVolume: event.target.value })}
                    placeholder="max"
                    aria-label="Maximum volume"
                  />
                </div>
              </div>
            ) : null}

            {openFilters.includes("competition") ? (
              <div className="space-y-1 text-xs font-semibold text-ink-700">
                Competition range
                <div className="flex items-center gap-2">
                  <TextInput
                    inputMode="numeric"
                    value={filters.minCompetition}
                    onChange={(event) =>
                      setFilters({ ...filters, minCompetition: event.target.value })
                    }
                    placeholder="min"
                    aria-label="Minimum competition"
                  />
                  <TextInput
                    inputMode="numeric"
                    value={filters.maxCompetition}
                    onChange={(event) =>
                      setFilters({ ...filters, maxCompetition: event.target.value })
                    }
                    placeholder="max"
                    aria-label="Maximum competition"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Checkbox
              checked={allMatchingSelected}
              disabled={filtered.length === 0}
              onChange={(event) =>
                setSelected(event.target.checked ? new Set(filtered.map((row) => row.id)) : new Set())
              }
            />
            Select all matching
          </label>
          <span className="text-xs text-ink-500">{formatNumber(selectedInView.length)} selected</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={filtered.length === 0 || workspace.busy}
            onClick={() => setPickerOpen(true)}
          >
            Add these keyword in your niche
          </Button>
          <Button
            variant="danger"
            disabled={selectedInView.length === 0}
            onClick={() => dropRows(selectedInView.map((row) => row.id))}
          >
            Delete selected
          </Button>
          <Button variant="ghost" disabled={rows.length === 0} onClick={discard}>
            Discard preview
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <div aria-hidden="true" className="text-3xl">
              📥
            </div>
            <p className="mt-2 text-base font-bold text-ink-900">No CSV loaded yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
              Click “Upload eRank CSV” above to bring in keywords, then filter and sort them here
              before sending them to Upcoming Work.
            </p>
          </div>
        ) : (
          <div
            className="max-h-96 overflow-auto rounded-xl border border-cream-200 bg-white"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
                setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length));
              }
            }}
          >
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-cream-200 text-left">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Keyword
                  </th>
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Volume
                  </th>
                  <th scope="col" className="px-3 py-2 text-xs font-bold tracking-wide text-ink-700 uppercase">
                    Competition
                  </th>
                  <th scope="col" className="w-10 px-3 py-2">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-ink-500">
                      No keyword matches these filters.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const band = competitionBand(row.competition, settings.competitionRules);

                    return (
                      <tr key={row.id} className="hover:bg-cream-50">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            aria-label={`Select ${row.keyword}`}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-ink-900">{row.keyword}</td>
                        <td className="tabular px-3 py-2 text-ink-700">{formatNumber(row.volume)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "tabular inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                              BAND_CLASS[band],
                            )}
                          >
                            {formatNumber(row.competition)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => dropRows([row.id])}
                            aria-label={`Remove ${row.keyword} from preview`}
                            className="rounded-full px-2 text-ink-500 hover:bg-cream-200 hover:text-ink-900"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {visibleCount < filtered.length ? (
              <p className="px-3 py-2 text-center text-xs text-ink-500">
                Showing {formatNumber(visibleCount)} of {formatNumber(filtered.length)} — scroll for
                more.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <NichePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={addToNiche}
        workspace={workspace}
        title="Add to a niche"
        description={`Choose a niche for the ${formatNumber(
          targetRows.length,
        )} selected keyword(s), or create a new one.`}
        confirmLabel="Add to this niche"
        previewKeywords={previewKeywords}
      />
    </div>
  );
}
