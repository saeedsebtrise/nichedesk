"use client";

import { useMemo, useState } from "react";

import { Check, Copies } from "@/components/marketing/icons";
import { NicheTag } from "@/components/niches/NicheTree";
import { Button } from "@/components/ui/primitives";
import { ScorePill } from "@/components/ui/ScorePill";
import { useToast } from "@/components/ui/toast";
import { findDuplicates, type DuplicateGroup } from "@/features/keywords/duplicates";
import { opportunityScore } from "@/features/keywords/opportunity";
import { ColorBadge } from "@/components/ui/ColorBadge";
import { competitionColor, volumeColor } from "@/features/settings/colors";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

/**
 * The duplicate finder: keywords that are the same search written differently
 * — word order, plurals, punctuation, small joining words. Each group keeps
 * one copy (the most searched, unless you pick another); merging moves any
 * tick or finished work onto it and removes the rest.
 */
export function DuplicatesTab({ workspace }: { workspace: Workspace }) {
  const toast = useToast();
  const { keywords, niches, settings, busy } = workspace;

  const groups = useMemo(() => findDuplicates(keywords), [keywords]);
  const [keepers, setKeepers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const visible = groups.filter((group) => !skipped.has(group.signature));

  const keeperOf = (group: DuplicateGroup) => {
    const chosen = keepers[group.signature];
    return group.keywords.some((keyword) => keyword.id === chosen) ? chosen : group.keywords[0].id;
  };

  const merge = async (list: DuplicateGroup[]) => {
    const result = await workspace.mergeKeywords(
      list.map((group) => ({ keepId: keeperOf(group), mergeIds: group.keywords.map((keyword) => keyword.id) })),
    );
    if (!result) return;
    toast({
      tone: "success",
      title: `Merged ${formatNumber(result.merged)} group${result.merged === 1 ? "" : "s"}`,
      detail: `${formatNumber(result.removed)} duplicate keyword${result.removed === 1 ? "" : "s"} removed — ticks and done work were kept.`,
    });
  };

  if (visible.length === 0) {
    return (
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25">
          <Check className="size-7" strokeWidth={2.4} />
        </span>
        <h2 className="font-display mt-6 text-2xl font-bold text-white">No duplicates found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream-200/55">
          NicheDesk looks for the same search written differently — word order, plurals, punctuation and small words like
          “for”.
        </p>
        {skipped.size > 0 ? (
          <Button variant="ghost" className="mt-5" onClick={() => setSkipped(new Set())}>
            Show the {skipped.size} group{skipped.size === 1 ? "" : "s"} I skipped
          </Button>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-amber-400/[0.08] via-white/[0.02] to-transparent p-6 sm:p-7">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25">
          <Copies className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            {formatNumber(visible.length)} group{visible.length === 1 ? "" : "s"} of possible duplicates
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-cream-200/60">
            The same words in another order, a plural or punctuation — like “christmas png” and “png christmas”. Pick the copy to
            keep; it takes over any tick and done work from the others.
          </p>
        </div>
        <Button variant="primary" disabled={busy} onClick={() => merge(visible)}>
          Merge all {formatNumber(visible.length)}
        </Button>
      </section>

      <ul className="grid gap-3 xl:grid-cols-2">
        {visible.map((group) => {
          const keeper = keeperOf(group);
          return (
            <li key={group.signature} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">
                  {group.keywords.length} copies
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="quiet"
                    className="px-2.5 py-1 text-xs"
                    onClick={() => setSkipped((current) => new Set(current).add(group.signature))}
                  >
                    Not duplicates
                  </Button>
                  <Button variant="outline" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => merge([group])}>
                    Merge
                  </Button>
                </div>
              </div>

              <fieldset className="mt-3 space-y-1.5">
                <legend className="sr-only">Copy to keep</legend>
                {group.keywords.map((keyword) => {
                  const kept = keeper === keyword.id;
                  return (
                    <label
                      key={keyword.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                        kept ? "border-brand-500/45 bg-brand-500/10" : "border-white/[0.06] hover:border-white/15",
                      )}
                    >
                      <input
                        type="radio"
                        name={`keep-${group.signature}`}
                        checked={kept}
                        onChange={() => setKeepers((current) => ({ ...current, [group.signature]: keyword.id }))}
                        className="size-4 accent-brand-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-white">{keyword.keyword}</span>
                          {kept ? (
                            <span className="rounded bg-brand-500 px-1.5 py-px text-[10px] font-bold text-white">KEEP</span>
                          ) : null}
                          {keyword.tick ? <span className="text-[10px] font-semibold text-brand-200">✓ ticked</span> : null}
                          {keyword.status === "done" ? (
                            <span className="text-[10px] font-semibold text-emerald-300">done</span>
                          ) : null}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-cream-200/45">
                          <NicheTag niches={niches} nicheId={keyword.nicheId} />
                          <span className="flex items-center gap-1">
                            vol
                            <ColorBadge size="sm" color={volumeColor(keyword.volume, settings)}>
                              {formatNumber(keyword.volume)}
                            </ColorBadge>
                          </span>
                        </span>
                      </span>
                      <span className="hidden sm:inline-block">
                        <ColorBadge color={competitionColor(keyword.competition, settings)}>
                          {formatNumber(keyword.competition)}
                        </ColorBadge>
                      </span>
                      <ScorePill score={opportunityScore(keyword.volume, keyword.competition)} />
                    </label>
                  );
                })}
              </fieldset>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
