"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppSidebar, type AppTab } from "@/components/app/AppSidebar";
import { CalendarTab } from "@/components/app/CalendarTab";
import { CommandPalette, PaletteShortcut, type PaletteItem } from "@/components/app/CommandPalette";
import { DuplicatesTab } from "@/components/app/DuplicatesTab";
import { OverviewTab } from "@/components/app/OverviewTab";
import { ArrowUpRight, Calendar, Check, Copies, Flame, ICONS, LayoutGrid, Menu, Plus } from "@/components/marketing/icons";
import { MotionProvider } from "@/components/marketing/motion";
import { NicheManagerModal } from "@/components/niches/NicheManagerModal";
import { SortKeywordTab } from "@/components/sort/SortKeywordTab";
import { Banner, Button } from "@/components/ui/primitives";
import { ToastProvider } from "@/components/ui/toast";
import { KeywordFormModal } from "@/components/work/KeywordFormModal";
import { UpcomingWorkTab } from "@/components/work/UpcomingWorkTab";
import { downloadCsv, keywordsToCsv } from "@/features/keywords/export";
import { EMPTY_WORK_FILTERS, applyWorkFilters, sortKeywords, type WorkFilters } from "@/features/keywords/filters";
import { OCCASIONS, countByOccasion } from "@/features/keywords/occasions";
import { flattenTree, nichePathLabel } from "@/features/niches/tree";
import { requestUpload } from "@/features/workspace/events";
import { useWorkspace } from "@/features/workspace/useWorkspace";
import type { StoreData } from "@/lib/store/types";
import { cn, formatNumber } from "@/lib/utils";

const UploadIcon = ICONS.upload;
const ListIcon = ICONS.list;
const TreeIcon = ICONS.tree;
const DownloadIcon = ICONS.download;
const SearchIcon = ICONS.search;

const TITLES: Record<AppTab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Where your keyword research stands" },
  sort: { title: "Sort Keyword", subtitle: "Import an eRank CSV, filter it, and file it into a niche" },
  work: { title: "Upcoming Work", subtitle: "Every saved keyword — filter, score, tick and mark done" },
  calendar: { title: "Season calendar", subtitle: "What to make now, and when buyers search" },
  duplicates: { title: "Duplicates", subtitle: "The same search written differently — merge the copies" },
};

export function AppShell({ initialData, locked = false }: { initialData: StoreData; locked?: boolean }) {
  return (
    <MotionProvider>
      <ToastProvider>
        <Desk initialData={initialData} locked={locked} />
      </ToastProvider>
    </MotionProvider>
  );
}

/**
 * The keyword desk: a sidebar with the niche tree, a top bar, and three views.
 * Sort Keyword stays mounted (hidden) while elsewhere, so an import preview
 * survives a look at the work queue, and a CSV can be dropped from any view.
 */
function Desk({ initialData, locked }: { initialData: StoreData; locked: boolean }) {
  const workspace = useWorkspace(initialData);
  const router = useRouter();
  const { keywords, niches, tree, settings } = workspace;

  const [tab, setTab] = useState<AppTab>(() => (initialData.keywords.length > 0 ? "overview" : "sort"));
  const [workFilters, setWorkFilters] = useState<WorkFilters>(EMPTY_WORK_FILTERS);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = useCallback((next: AppTab) => {
    setTab(next);
    setDrawerOpen(false);
  }, []);

  const showSort = useCallback(() => go("sort"), [go]);

  /** Opens Upcoming Work on a fresh set of filters. */
  const openWork = useCallback(
    (patch: Partial<WorkFilters>) => {
      setWorkFilters({ ...EMPTY_WORK_FILTERS, ...patch });
      go("work");
    },
    [go],
  );

  /** Narrows Upcoming Work to one niche, keeping the other filters. */
  const openNiche = useCallback(
    (nicheId: string | "all" | "none") => {
      setWorkFilters((current) => ({ ...current, nicheId }));
      go("work");
    },
    [go],
  );

  // Ctrl/⌘ K or "/" opens the command palette; Escape closes the mobile drawer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.key === "Escape") setDrawerOpen(false);
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The extension fills the inbox from another tab; pick that up when this tab is looked at again.
  const { refresh } = workspace;
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const green = settings.competitionRules.green;
    return [
      { id: "go-overview", group: "Go to", label: "Overview", detail: "Dashboard", icon: <LayoutGrid className="size-4" />, run: () => go("overview") },
      {
        id: "go-sort",
        group: "Go to",
        label: "Sort Keyword",
        detail: "Import and filter an eRank CSV",
        icon: <UploadIcon className="size-4" />,
        run: () => go("sort"),
      },
      {
        id: "go-work",
        group: "Go to",
        label: "Upcoming Work",
        detail: "Every saved keyword",
        icon: <ListIcon className="size-4" />,
        run: () => openWork({}),
      },
      {
        id: "go-calendar",
        group: "Go to",
        label: "Season calendar",
        detail: "What to make now, and when buyers search",
        icon: <Calendar className="size-4" />,
        run: () => go("calendar"),
      },
      {
        id: "go-duplicates",
        group: "Go to",
        label: "Duplicates",
        detail: "Find and merge the same search written differently",
        icon: <Copies className="size-4" />,
        run: () => go("duplicates"),
      },
      {
        id: "act-upload",
        group: "Actions",
        label: "Import an eRank CSV",
        keywords: "upload file",
        icon: <UploadIcon className="size-4" />,
        run: () => requestUpload(),
      },
      { id: "act-add", group: "Actions", label: "Add a keyword", keywords: "new manual", icon: <Plus className="size-4" />, run: () => setAddOpen(true) },
      {
        id: "act-niches",
        group: "Actions",
        label: "Manage niches",
        keywords: "tree subniche rename delete create",
        icon: <TreeIcon className="size-4" />,
        run: () => setManagerOpen(true),
      },
      {
        id: "act-export",
        group: "Actions",
        label: "Export Upcoming Work to CSV",
        detail: "Uses the filters currently set there",
        keywords: "download",
        icon: <DownloadIcon className="size-4" />,
        run: () =>
          downloadCsv(keywordsToCsv(sortKeywords(applyWorkFilters(keywords, workFilters, niches), "volume", "desc"), niches)),
      },
      { id: "view-pending", group: "Views", label: "Pending keywords", icon: <ListIcon className="size-4" />, run: () => openWork({ status: "pending" }) },
      {
        id: "view-low",
        group: "Views",
        label: "Low-competition keywords",
        detail: `Pending, under ${formatNumber(green)} competing listings`,
        icon: <Flame className="size-4" />,
        run: () => openWork({ status: "pending", maxCompetition: String(Math.max(0, green - 1)) }),
      },
      { id: "view-ticked", group: "Views", label: "Ticked keywords", icon: <Check className="size-4" />, run: () => openWork({ status: "ticked" }) },
      { id: "view-done", group: "Views", label: "Done keywords", icon: <Check className="size-4" />, run: () => openWork({ status: "done" }) },
      ...(() => {
        const counts = countByOccasion(keywords);
        return OCCASIONS.filter((occasion) => counts.has(occasion.id)).map((occasion) => ({
          id: `occasion-${occasion.id}`,
          group: "Occasions",
          label: `${occasion.label} keywords`,
          detail: `${formatNumber(counts.get(occasion.id)?.pending ?? 0)} pending`,
          icon: <span aria-hidden="true">{occasion.emoji}</span>,
          run: () => openWork({ occasion: occasion.id }),
        }));
      })(),
      ...flattenTree(tree).map((node) => ({
        id: `niche-${node.id}`,
        group: "Niches",
        label: nichePathLabel(niches, node.id),
        icon: <TreeIcon className="size-4" />,
        run: () => openWork({ nicheId: node.id }),
      })),
      { id: "site", group: "Links", label: "Back to the website", icon: <ArrowUpRight className="size-4" />, run: () => router.push("/") },
    ];
  }, [settings.competitionRules.green, tree, niches, keywords, workFilters, go, openWork, router]);

  const searchKeywords = useCallback(
    (query: string): PaletteItem[] =>
      keywords
        .filter((keyword) => keyword.keyword.toLowerCase().includes(query))
        .slice(0, 8)
        .map((keyword) => ({
          id: `kw-${keyword.id}`,
          group: "Keywords",
          label: keyword.keyword,
          detail: `${nichePathLabel(niches, keyword.nicheId) || "No niche"} · vol ${formatNumber(keyword.volume)} · comp ${formatNumber(keyword.competition)}`,
          icon: <SearchIcon className="size-4" />,
          run: () => openWork({ search: keyword.keyword }),
        })),
    [keywords, niches, openWork],
  );

  const footer = (
    <div className="space-y-3">
      <p role="status" className="flex items-center gap-2 text-xs text-cream-200/50">
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", workspace.busy ? "animate-pulse bg-brand-400" : "bg-emerald-400")}
        />
        {workspace.busy ? "Saving…" : "All changes saved"}
      </p>
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-cream-200/55 transition-colors hover:text-white">
          Website <ArrowUpRight className="size-3.5" />
        </Link>
        {locked ? (
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/session", { method: "DELETE" });
              router.replace("/login");
            }}
            className="text-xs font-semibold text-cream-200/55 transition-colors hover:text-white"
          >
            Log out
          </button>
        ) : null}
      </div>
    </div>
  );

  const sidebar = (
    <AppSidebar
      workspace={workspace}
      tab={tab}
      onTab={go}
      activeNiche={tab === "work" ? workFilters.nicheId : null}
      onNiche={openNiche}
      onManageNiches={() => setManagerOpen(true)}
      onOpenPalette={() => setPaletteOpen(true)}
      footer={footer}
    />
  );

  return (
    <div className="ndapp flex min-h-dvh bg-night-950 text-cream-100">
      <aside
        aria-label="Sidebar"
        className="sticky top-0 hidden h-dvh w-[17rem] shrink-0 border-r border-white/[0.07] bg-white/[0.012] lg:block"
      >
        {sidebar}
      </aside>

      <AnimatePresence>
        {drawerOpen ? (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        ) : null}
        {drawerOpen ? (
          <motion.aside
            key="drawer"
            aria-label="Sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="fixed inset-y-0 left-0 z-50 w-[18rem] max-w-[85vw] border-r border-white/10 bg-night-950 lg:hidden"
          >
            {sidebar}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-night-950/75 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display truncate text-lg font-bold tracking-tight text-white">{TITLES[tab].title}</h1>
              <p className="hidden truncate text-xs text-cream-200/45 sm:block">{TITLES[tab].subtitle}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {workspace.busy ? (
                <span className="hidden items-center gap-2 text-xs text-cream-200/55 xl:flex">
                  <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-brand-400" />
                  Saving…
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream-200/50 transition-colors hover:border-white/15 hover:text-white md:flex"
              >
                <SearchIcon className="size-4" /> Search
                <PaletteShortcut />
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search"
                className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white md:hidden"
              >
                <SearchIcon className="size-4" />
              </button>
              {/* Wrapped: `hidden` on the Button itself loses to its own inline-flex. */}
              <span className="hidden sm:inline-flex">
                <Button variant="ghost" onClick={() => requestUpload()}>
                  <UploadIcon className="size-4" /> Import CSV
                </Button>
              </span>
              <Button variant="primary" onClick={() => setAddOpen(true)} aria-label="Add keyword">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add keyword</span>
              </Button>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[112rem]">
            {workspace.error ? (
              <div className="mb-5">
                <Banner tone="error" onDismiss={workspace.clearError}>
                  {workspace.error}
                </Banner>
              </div>
            ) : null}

            {tab === "overview" ? (
              <OverviewTab
                workspace={workspace}
                onOpenWork={openWork}
                onAddKeyword={() => setAddOpen(true)}
                onManageNiches={() => setManagerOpen(true)}
                onOpenCalendar={() => go("calendar")}
                onOpenDuplicates={() => go("duplicates")}
              />
            ) : null}

            {tab === "calendar" ? <CalendarTab workspace={workspace} onOpenWork={openWork} /> : null}

            {tab === "duplicates" ? <DuplicatesTab workspace={workspace} /> : null}

            <div hidden={tab !== "sort"}>
              <SortKeywordTab workspace={workspace} onShow={showSort} />
            </div>

            {tab === "work" ? (
              <UpcomingWorkTab
                workspace={workspace}
                filters={workFilters}
                onFiltersChange={setWorkFilters}
                onAddKeyword={() => setAddOpen(true)}
              />
            ) : null}
          </div>
        </main>
      </div>

      <KeywordFormModal open={addOpen} onClose={() => setAddOpen(false)} workspace={workspace} keyword={null} />
      <NicheManagerModal open={managerOpen} onClose={() => setManagerOpen(false)} workspace={workspace} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        searchMore={searchKeywords}
      />
    </div>
  );
}
