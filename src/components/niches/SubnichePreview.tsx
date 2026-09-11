"use client";

import type { SubnichePlan } from "@/features/niches/auto-group";
import { formatNumber } from "@/lib/utils";

const SHOWN = 8;

/** The subniches a plan would create, biggest first, and what stays behind. */
export function SubnichePreview({ plan, parentName }: { plan: SubnichePlan; parentName: string }) {
  if (plan.groups.length === 0) {
    return (
      <p className="text-xs text-cream-200/55">
        No theme is shared by {plan.minGroupSize}+ keywords, so everything goes straight into “{parentName}”.
        Lower the minimum to find smaller themes.
      </p>
    );
  }

  const shown = plan.groups.slice(0, SHOWN);
  const hidden = plan.groups.length - shown.length;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-cream-100">
        {plan.groups.length} subniche{plan.groups.length === 1 ? "" : "s"} under “{parentName}”:
      </p>
      <ul className="max-h-40 space-y-1 overflow-y-auto">
        {shown.map((group) => (
          <li key={group.term} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs">
            <span aria-hidden="true" className="text-brand-400">
              └
            </span>
            <span className="truncate font-medium text-white">{group.name}</span>
            <span className="tabular ml-auto shrink-0 rounded-md bg-brand-500/20 px-1.5 py-0.5 font-bold text-brand-200">
              {formatNumber(group.members.length)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-cream-200/50">
        {hidden > 0 ? `+ ${hidden} more subniche${hidden === 1 ? "" : "s"} · ` : ""}
        {formatNumber(plan.rest.length)} keyword{plan.rest.length === 1 ? "" : "s"} stay in “{parentName}”
      </p>
    </div>
  );
}
