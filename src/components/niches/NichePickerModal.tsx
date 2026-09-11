"use client";

import { useMemo, useState } from "react";

import { NicheTreeList, NicheTreeSelect } from "@/components/niches/NicheTree";
import { SubnichePreview } from "@/components/niches/SubnichePreview";
import { Banner, Button, Checkbox, FieldLabel, Modal, TextInput } from "@/components/ui/primitives";
import { defaultMinGroupSize, planSubniches } from "@/features/niches/auto-group";
import { nichePathLabel } from "@/features/niches/tree";
import type { Workspace } from "@/features/workspace/useWorkspace";

export type AutoSubniches = { minGroupSize: number } | null;

/**
 * The picker body — mounted only while the dialog is open, so each open starts
 * from a clean search box and selection without resetting state in an effect.
 */
function NichePickerBody({
  workspace,
  onConfirm,
  onClose,
  confirmLabel,
  allowNone,
  previewKeywords,
}: {
  workspace: Workspace;
  onConfirm: (nicheId: string | null, autoSubniches: AutoSubniches) => void;
  onClose: () => void;
  confirmLabel: string;
  allowNone: boolean;
  previewKeywords?: string[];
}) {
  const { tree, niches, busy } = workspace;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string | "all" | "none">("none");
  const [localError, setLocalError] = useState<string | null>(null);
  const [autoOn, setAutoOn] = useState(true);
  const [minSize, setMinSize] = useState(() => defaultMinGroupSize(previewKeywords?.length ?? 0));

  // Typing a new name previews under that name; otherwise the selected niche.
  const parentName =
    newName.trim() || (selectedId ? (niches.find((niche) => niche.id === selectedId)?.name ?? "") : "");

  const plan = useMemo(
    () =>
      previewKeywords && autoOn && parentName
        ? planSubniches(previewKeywords, parentName, { minGroupSize: minSize })
        : null,
    [previewKeywords, autoOn, parentName, minSize],
  );

  const autoSubniches: AutoSubniches = previewKeywords && autoOn ? { minGroupSize: minSize } : null;

  const createAndUse = async () => {
    if (newName.trim() === "") {
      setLocalError("Give the new niche a name.");
      return;
    }

    setLocalError(null);
    const parentId = newParentId === "none" || newParentId === "all" ? null : newParentId;
    const created = await workspace.createNiche(newName.trim(), parentId);
    if (created) onConfirm(created.id, autoSubniches);
  };

  return (
    <div className="space-y-4">
      {workspace.error ?? localError ? <Banner tone="error">{localError ?? workspace.error}</Banner> : null}

      <div className="space-y-2">
        <FieldLabel>Search niches</FieldLabel>
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type to search…"
          aria-label="Search niches"
        />
        <NicheTreeList tree={tree} niches={niches} search={search} selectedId={selectedId} onSelect={setSelectedId} />
        {selectedId ? (
          <p className="text-xs text-cream-200/50">
            Selected: <span className="font-semibold text-cream-100">{nichePathLabel(niches, selectedId)}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
        <FieldLabel>Create new niche</FieldLabel>
        <TextInput
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="e.g. wedding gifts"
          aria-label="New niche name"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void createAndUse();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="new-niche-parent" className="text-xs font-semibold text-cream-200/65">
            Nest under
          </label>
          <NicheTreeSelect
            id="new-niche-parent"
            tree={tree}
            value={newParentId}
            onChange={setNewParentId}
            noneLabel="Top level (no parent)"
            className="min-w-44 flex-1"
          />
        </div>
        <Button variant="outline" onClick={createAndUse} disabled={busy}>
          Create &amp; use this niche
        </Button>
      </div>

      {previewKeywords ? (
        <div className="space-y-3 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <Checkbox checked={autoOn} onChange={(event) => setAutoOn(event.target.checked)} />
            Auto-create subniches
          </label>
          {autoOn ? (
            <>
              <label className="flex items-center gap-2 text-xs text-cream-200/65">
                Min keywords per subniche
                <TextInput
                  type="number"
                  min={2}
                  value={String(minSize)}
                  onChange={(event) => setMinSize(Math.max(2, Number(event.target.value) || 2))}
                  className="max-w-20 py-1 text-xs"
                />
              </label>
              {plan ? (
                <SubnichePreview plan={plan} parentName={parentName} />
              ) : (
                <p className="text-xs text-cream-200/50">Pick or create a niche to preview its subniches.</p>
              )}
            </>
          ) : (
            <p className="text-xs text-cream-200/50">All keywords go straight into the niche you choose.</p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.08] pt-4">
        {allowNone ? (
          <Button variant="quiet" onClick={() => onConfirm(null, null)} disabled={busy}>
            Clear niche
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={busy || selectedId === null}
          onClick={() => selectedId && onConfirm(selectedId, autoSubniches)}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * "Add to a niche" / "Move to niche".
 *
 * Both flows are the same choice — pick an existing niche from the tree, or
 * create one and use it immediately. The create form carries a parent picker so
 * a subniche can be made without a detour through the niche manager. When
 * `previewKeywords` is given (the import flow), it also offers to sort those
 * keywords into automatic subniches, with a live preview.
 */
export function NichePickerModal({
  open,
  onClose,
  onConfirm,
  workspace,
  title,
  description,
  confirmLabel,
  allowNone = false,
  previewKeywords,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (nicheId: string | null, autoSubniches: AutoSubniches) => void;
  workspace: Workspace;
  title: string;
  description: string;
  confirmLabel: string;
  /** Move flows may clear the niche; add flows must land somewhere. */
  allowNone?: boolean;
  previewKeywords?: string[];
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <NichePickerBody
        workspace={workspace}
        onConfirm={onConfirm}
        onClose={onClose}
        confirmLabel={confirmLabel}
        allowNone={allowNone}
        previewKeywords={previewKeywords}
      />
    </Modal>
  );
}
