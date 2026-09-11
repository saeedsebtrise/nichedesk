"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/shared/Wordmark";
import { SortKeywordTab } from "@/components/sort/SortKeywordTab";
import { UpcomingWorkTab } from "@/components/work/UpcomingWorkTab";
import { useWorkspace } from "@/features/workspace/useWorkspace";
import type { StoreData } from "@/lib/store/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "sort", label: "Sort Keyword" },
  { id: "work", label: "Upcoming Work" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AppShell({ initialData, locked = false }: { initialData: StoreData; locked?: boolean }) {
  const workspace = useWorkspace(initialData);
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("sort");

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-brand-500/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Wordmark />
          <h1 className="sr-only">NicheDesk keyword desk</h1>

          <div className="ml-auto flex items-center gap-3">
            {workspace.busy ? (
              <span role="status" className="text-xs font-semibold text-brand-600">
                Saving…
              </span>
            ) : null}
            {locked ? (
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/session", { method: "DELETE" });
                  router.replace("/login");
                }}
                className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-cream-100"
              >
                Log out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-5">
        <div role="tablist" aria-label="Sections" className="mb-4 flex gap-2">
          {TABS.map((entry) => {
            const active = entry.id === tab;

            return (
              <button
                key={entry.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  setTab(entry.id);
                  workspace.clearError();
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-brand-500 text-white shadow-sm"
                    : "border border-cream-300 bg-white text-ink-700 hover:bg-cream-100",
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        {tab === "sort" ? (
          <SortKeywordTab workspace={workspace} />
        ) : (
          <UpcomingWorkTab workspace={workspace} />
        )}
      </main>
    </div>
  );
}
