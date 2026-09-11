"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { timeAgo, useNowMinute } from "@/components/app/clock";
import { ArrowRight, Close, ICONS, Inbox, Plus, Trash } from "@/components/marketing/icons";
import { NichePickerModal, type AutoSubniches } from "@/components/niches/NichePickerModal";
import { MovementBadge } from "@/components/ui/Movement";
import { Banner, Button, Checkbox, TextInput } from "@/components/ui/primitives";
import { ScorePill } from "@/components/ui/ScorePill";
import { useToast } from "@/components/ui/toast";
import { parseErankCsv } from "@/features/keywords/csv";
import { EMPTY_IMPORT_FILTERS, applyImportFilters, type ImportFilters } from "@/features/keywords/filters";
import { percentChange } from "@/features/keywords/history";
import { opportunityScore } from "@/features/keywords/opportunity";
import type { ImportRow, Keyword } from "@/features/keywords/types";
import type { InboxBatch } from "@/lib/store/types";
import { BAND_CLASS, competitionBand } from "@/features/settings/competition";
import { UPLOAD_EVENT } from "@/features/workspace/events";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

const UploadIcon = ICONS.upload;

/** How many preview rows to mount at once; more are appended while scrolling. */
const PAGE_SIZE = 200;

type FilterKey = "including" | "excluding" | "volume" | "competition";

const FILTER_LABEL: Record<FilterKey, string> = {
  including: "Including",
  excluding: "Excluding",
  volume: "Volume",
  competition: "Competition",
};

/** Chip text for an active filter, e.g. `Including “png”`. */
function chipSummary(key: FilterKey, filters: ImportFilters): string | null {
  if (key === "including" && filters.including.trim() !== "") return `Including “${filters.including.trim()}”`;
  if (key === "excluding" && filters.excluding.trim() !== "") return `Excluding “${filters.excluding.trim()}”`;
  if (key === "volume" && (filters.minVolume !== "" || filters.maxVolume !== "")) {
    return `Volume ${filters.minVolume || "0"} – ${filters.maxVolume || "∞"}`;
  }
  if (key === "competition" && (filters.minCompetition !== "" || filters.maxCompetition !== "")) {
    return `Competition ${filters.minCompetition || "0"} – ${filters.maxCompetition || "∞"}`;
  }
  return null;
}

const TH = "px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase";

const STEPS = [
  { title: "Upload", body: "Drop in an eRank Keyword Tool export — or any CSV with keyword, volume and competition." },
  { title: "Filter", body: "Keep what fits your shop: include or exclude words, set volume and competition limits." },
  { title: "File it", body: "Send the keepers to a niche. Auto subniches split them into a tree as they land." },
];

function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">{label}</p>
      <div className="mt-1.5 text-lg font-bold text-white">{children}</div>
    </div>
  );
}

export function SortKeywordTab({ workspace, onShow }: { workspace: Workspace; onShow: () => void }) {
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
  const [dragging, setDragging] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => applyImportFilters(rows, filters), [rows, filters]);
  const visibleRows = filtered.slice(0, visibleCount);

  // Selection survives filter changes, so only count what is currently matched.
  const selectedInView = useMemo(() => filtered.filter((row) => selected.has(row.id)), [filtered, selected]);
  const allMatchingSelected = filtered.length > 0 && selectedInView.length === filtered.length;

  // What "Add to a niche" saves: the selected rows, or every match if none are selected.
  const targetRows = selectedInView.length > 0 ? selectedInView : filtered;
  const previewKeywords = useMemo(() => targetRows.map((row) => row.keyword), [targetRows]);

  const nowMinute = useNowMinute();

  // Saved keywords by text, so the preview can show what is already in the desk.
  const savedByText = useMemo(() => {
    const map = new Map<string, Keyword>();
    for (const keyword of workspace.keywords) {
      const key = keyword.keyword.toLowerCase();
      if (!map.has(key)) map.set(key, keyword);
    }
    return map;
  }, [workspace.keywords]);

  const summary = useMemo(() => {
    let scoreSum = 0;
    let low = 0;
    let saved = 0;
    for (const row of filtered) {
      scoreSum += opportunityScore(row.volume, row.competition);
      if (competitionBand(row.competition, settings.competitionRules) === "green") low += 1;
      if (savedByText.has(row.keyword.toLowerCase())) saved += 1;
    }
    return { low, saved, avg: filtered.length > 0 ? Math.round(scoreSum / filtered.length) : 0 };
  }, [filtered, settings.competitionRules, savedByText]);

  /** Puts a fresh set of rows into the preview, clearing filters and selection. */
  const showRows = useCallback((parsed: ImportRow[], name: string, parseWarnings: string[]) => {
    setRows(parsed);
    setFileName(name);
    setWarnings(parseWarnings);
    setFilters(EMPTY_IMPORT_FILTERS);
    setOpenFilters([]);
    setSelected(new Set());
    setVisibleCount(PAGE_SIZE);
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      let text: string;
      try {
        text = await file.text();
      } catch {
        toast({ tone: "error", title: "Could not read that file", detail: file.name });
        return;
      }
      const { rows: parsed, warnings: parseWarnings } = parseErankCsv(text);
      showRows(parsed, file.name, parseWarnings);

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
    },
    [toast, showRows],
  );

  /** Opens an extension batch in the preview; once it is here, the inbox copy goes. */
  const openBatch = async (batch: InboxBatch) => {
    const parsed = batch.rows.map((row, index) => ({ id: `${batch.id}-${index}`, ...row }));
    showRows(parsed, `${batch.label} · from eRank`, []);
    toast({
      tone: "success",
      title: "Opened in the preview",
      detail: `${formatNumber(parsed.length)} keywords from “${batch.label}” — filter them, then add them to a niche.`,
    });
    await workspace.dismissInbox(batch.id);
  };

  // The top bar, the command palette and the overview open the picker through a window event.
  useEffect(() => {
    const open = () => {
      onShow();
      fileInput.current?.click();
    };
    window.addEventListener(UPLOAD_EVENT, open);
    return () => window.removeEventListener(UPLOAD_EVENT, open);
  }, [onShow]);

  // A CSV dropped anywhere in the tool lands here.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      // Switch to this view straight away: the overlay lives here, and a hidden view shows nothing.
      if (depth === 0) onShow();
      depth += 1;
      setDragging(true);
    };
    const onOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const file = event.dataTransfer?.files[0];
      if (file) {
        onShow();
        void loadFile(file);
      }
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onShow, loadFile]);

  const pickFile = () => fileInput.current?.click();

  const toggleFilter = (key: FilterKey) => {
    setOpenFilters((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
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
      result.updated
        ? `${formatNumber(result.updated)} saved keyword${result.updated === 1 ? "" : "s"} got fresh numbers`
        : null,
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
  };

  const anyFilterActive = (Object.keys(FILTER_LABEL) as FilterKey[]).some((key) => chipSummary(key, filters) !== null);

  return (
    <div className="space-y-5">
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadFile(file);
          // Lets the same file be picked again after a discard.
          event.target.value = "";
        }}
      />

      {workspace.inbox.length > 0 ? (
        <section
          aria-labelledby="inbox-title"
          className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/[0.12] to-transparent p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_0_24px_-4px_rgba(244,103,31,0.8)]">
              <Inbox className="size-4" />
            </span>
            <div>
              <h2 id="inbox-title" className="font-semibold text-white">
                Inbox · from the extension
              </h2>
              <p className="text-xs text-cream-200/55">
                Keywords sent with “Send to NicheDesk” on eRank. Open one to filter it here before it goes in a niche.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {workspace.inbox.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-night-950/40 px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-white">{batch.label}</span>
                  <span className="block text-xs text-cream-200/50">
                    {formatNumber(batch.rows.length)} keywords{nowMinute !== null ? ` · ${timeAgo(batch.createdAt, nowMinute)}` : ""}
                  </span>
                </span>
                <Button variant="primary" className="px-3 py-1.5 text-xs" disabled={workspace.busy} onClick={() => openBatch(batch)}>
                  Open in preview
                </Button>
                <Button
                  variant="quiet"
                  className="px-2.5 py-1.5 text-xs"
                  disabled={workspace.busy}
                  onClick={() => workspace.dismissInbox(batch.id)}
                >
                  Dismiss
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <>
          <button
            type="button"
            onClick={pickFile}
            className="group relative isolate flex w-full flex-col items-center overflow-hidden rounded-3xl border-2 border-dashed border-white/[0.12] bg-white/[0.015] px-6 py-16 text-center transition-colors hover:border-brand-500/50 hover:bg-brand-500/[0.03] sm:py-24"
          >
            <span
              aria-hidden="true"
              className="absolute top-0 left-1/2 -z-10 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,103,31,0.22),transparent)] blur-2xl"
            />
            <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_0_60px_-8px_rgba(244,103,31,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform group-hover:-translate-y-1">
              <UploadIcon className="size-7" />
            </span>
            <span className="font-display mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Drop your eRank CSV here
            </span>
            <span className="mt-2 max-w-md text-sm text-cream-200/55">
              or <span className="font-semibold text-brand-300 underline-offset-4 group-hover:underline">browse your files</span>.
              Nothing is saved until you choose a niche.
            </span>
            <span className="mt-7 flex flex-wrap justify-center gap-2">
              {["eRank Keyword Tool exports", "Any keyword · volume · competition CSV", "Duplicates dropped automatically"].map(
                (label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-cream-200/55">
                    {label}
                  </span>
                ),
              )}
            </span>
          </button>

          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <span className="font-display text-sm font-bold text-brand-300">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-2 font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-cream-200/55">{step.body}</p>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-[11px] font-black text-emerald-300 ring-1 ring-emerald-400/25">
            CSV
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-white">{fileName}</h2>
            <p className="text-xs text-cream-200/50">
              Import preview — {formatNumber(rows.length)} keyword{rows.length === 1 ? "" : "s"}, not saved yet
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={pickFile}>
              <UploadIcon className="size-4" /> Upload another
            </Button>
            <Button variant="quiet" onClick={discard}>
              Discard preview
            </Button>
          </div>
        </div>
      )}

      {warnings.map((warning) => (
        <Banner key={warning} tone="info">
          {warning}
        </Banner>
      ))}

      {rows.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="Matching">
              {formatNumber(filtered.length)}
              <span className="text-sm font-medium text-cream-200/45"> / {formatNumber(rows.length)}</span>
            </MiniStat>
            <MiniStat label="Low competition">{formatNumber(summary.low)}</MiniStat>
            <MiniStat label="Avg. score">
              <ScorePill score={summary.avg} showLabel />
            </MiniStat>
            <MiniStat label="Already saved">
              {formatNumber(summary.saved)}
              <span className="text-sm font-medium text-cream-200/45"> get fresh numbers</span>
            </MiniStat>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">Filters</span>
              {(Object.keys(FILTER_LABEL) as FilterKey[]).map((key) => {
                const summaryText = chipSummary(key, filters);
                const open = openFilters.includes(key);

                if (summaryText) {
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center overflow-hidden rounded-xl border border-brand-500/50 bg-brand-500/15 text-sm font-semibold text-brand-100"
                    >
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => toggleFilter(key)}
                        className="px-3 py-2 transition-colors hover:bg-brand-500/15"
                      >
                        {summaryText}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFilter(key)}
                        aria-label={`Remove ${FILTER_LABEL[key]} filter`}
                        className="border-l border-brand-500/30 px-2.5 py-2 transition-colors hover:bg-brand-500/25"
                      >
                        <Close className="size-3.5" />
                      </button>
                    </span>
                  );
                }

                return (
                  <Button key={key} variant={open ? "chipActive" : "chip"} aria-expanded={open} onClick={() => toggleFilter(key)}>
                    <Plus className="size-3.5" />
                    {FILTER_LABEL[key]}
                  </Button>
                );
              })}
              {anyFilterActive ? (
                <Button variant="quiet" onClick={clearAll}>
                  Clear all
                </Button>
              ) : null}
            </div>

            {openFilters.length > 0 ? (
              <div className="mt-3 grid gap-3 rounded-xl border border-white/[0.07] bg-night-950/40 p-3 sm:grid-cols-2">
                {openFilters.includes("including") ? (
                  <label className="space-y-1.5 text-xs font-semibold text-cream-200/60">
                    Including (comma-separated, any match)
                    <TextInput
                      value={filters.including}
                      onChange={(event) => setFilters({ ...filters, including: event.target.value })}
                      placeholder="png, svg"
                    />
                  </label>
                ) : null}

                {openFilters.includes("excluding") ? (
                  <label className="space-y-1.5 text-xs font-semibold text-cream-200/60">
                    Excluding (comma-separated)
                    <TextInput
                      value={filters.excluding}
                      onChange={(event) => setFilters({ ...filters, excluding: event.target.value })}
                      placeholder="free, bundle"
                    />
                  </label>
                ) : null}

                {openFilters.includes("volume") ? (
                  <div className="space-y-1.5 text-xs font-semibold text-cream-200/60">
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
                  <div className="space-y-1.5 text-xs font-semibold text-cream-200/60">
                    Competition range
                    <div className="flex items-center gap-2">
                      <TextInput
                        inputMode="numeric"
                        value={filters.minCompetition}
                        onChange={(event) => setFilters({ ...filters, minCompetition: event.target.value })}
                        placeholder="min"
                        aria-label="Minimum competition"
                      />
                      <TextInput
                        inputMode="numeric"
                        value={filters.maxCompetition}
                        onChange={(event) => setFilters({ ...filters, maxCompetition: event.target.value })}
                        placeholder="max"
                        aria-label="Maximum competition"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-white">
              <Checkbox
                checked={allMatchingSelected}
                disabled={filtered.length === 0}
                onChange={(event) =>
                  setSelected(event.target.checked ? new Set(filtered.map((row) => row.id)) : new Set())
                }
              />
              Select all matching
            </label>
            <span className="text-xs text-cream-200/50">{formatNumber(selectedInView.length)} selected</span>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={selectedInView.length === 0}
                onClick={() => dropRows(selectedInView.map((row) => row.id))}
              >
                <Trash className="size-4" /> Remove selected
              </Button>
              <Button variant="primary" disabled={filtered.length === 0 || workspace.busy} onClick={() => setPickerOpen(true)}>
                Add {formatNumber(targetRows.length)} to a niche
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div
            className="max-h-[32rem] overflow-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
                setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length));
              }
            }}
          >
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#140d09]/95 text-left backdrop-blur">
                <tr className="border-b border-white/[0.08]">
                  <th scope="col" className="w-12 px-4 py-3">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className={TH}>
                    Keyword
                  </th>
                  <th scope="col" className={TH}>
                    Score
                  </th>
                  <th scope="col" className={cn(TH, "text-right")}>
                    Volume
                  </th>
                  <th scope="col" className={TH}>
                    Competition
                  </th>
                  <th scope="col" className="w-12 px-2 py-3">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-cream-200/50">
                      No keyword matches these filters.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const band = competitionBand(row.competition, settings.competitionRules);
                    const isSelected = selected.has(row.id);
                    const saved = savedByText.get(row.keyword.toLowerCase());

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]",
                          isSelected && "bg-brand-500/[0.07]",
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <Checkbox checked={isSelected} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.keyword}`} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-white">{row.keyword}</span>
                          {saved ? (
                            <span
                              title={`Already saved — volume was ${formatNumber(saved.volume)}`}
                              className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-cream-200/60"
                            >
                              Saved
                              <MovementBadge change={percentChange(saved.volume, row.volume)} goodWhen="up" />
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          <ScorePill score={opportunityScore(row.volume, row.competition)} />
                        </td>
                        <td className="tabular px-4 py-2.5 text-right text-cream-200/75">{formatNumber(row.volume)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("tabular inline-block rounded-md px-2 py-0.5 text-xs font-bold", BAND_CLASS[band])}>
                            {formatNumber(row.competition)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => dropRows([row.id])}
                            aria-label={`Remove ${row.keyword} from preview`}
                            className="rounded-lg p-1.5 text-cream-200/35 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <Close className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {visibleCount < filtered.length ? (
              <p className="px-4 py-3 text-center text-xs text-cream-200/45">
                Showing {formatNumber(visibleCount)} of {formatNumber(filtered.length)} — scroll for more.
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Shown over the whole tool while a file is dragged in. */}
      <AnimatePresence>
        {dragging ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-night-950/80 p-6 backdrop-blur-sm"
          >
            <div className="flex size-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-500/60 bg-brand-500/[0.05] text-center">
              <span className="grid size-20 place-items-center rounded-3xl bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_0_80px_-10px_rgba(244,103,31,0.95)]">
                <UploadIcon className="size-9" />
              </span>
              <p className="font-display mt-6 text-3xl font-bold text-white">Drop to import</p>
              <p className="mt-2 text-cream-200/60">It opens in Sort Keyword — nothing is saved yet.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <NichePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={addToNiche}
        workspace={workspace}
        title="Add to a niche"
        description={`Choose a niche for the ${formatNumber(targetRows.length)} selected keyword(s), or create a new one.`}
        confirmLabel="Add to this niche"
        previewKeywords={previewKeywords}
      />
    </div>
  );
}
