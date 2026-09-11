"use client";

import { useState } from "react";

import { NicheTreeList, NicheTreeSelect } from "@/components/niches/NicheTree";
import { Banner, Button, FieldLabel, Modal, TextInput } from "@/components/ui/primitives";
import { nichePathLabel } from "@/features/niches/tree";
import type { Workspace } from "@/features/workspace/useWorkspace";

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
}: {
  workspace: Workspace;
  onConfirm: (nicheId: string | null) => void;
  onClose: () => void;
  confirmLabel: string;
  allowNone: boolean;
}) {
  const { tree, niches, busy } = workspace;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string | "all" | "none">("none");
  const [localError, setLocalError] = useState<string | null>(null);

  const createAndUse = async () => {
    if (newName.trim() === "") {
      setLocalError("Give the new niche a name.");
      return;
    }

    setLocalError(null);
    const parentId = newParentId === "none" || newParentId === "all" ? null : newParentId;
    const created = await workspace.createNiche(newName.trim(), parentId);
    if (created) onConfirm(created.id);
  };

  return (
    <div className="space-y-4">
      {workspace.error ?? localError ? (
        <Banner tone="error">{localError ?? workspace.error}</Banner>
      ) : null}

      <div className="space-y-2">
        <FieldLabel>Search niches</FieldLabel>
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type to search..."
          aria-label="Search niches"
        />
        <NicheTreeList
          tree={tree}
          niches={niches}
          search={search}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selectedId ? (
          <p className="text-xs text-ink-500">
            Selected:{" "}
            <span className="font-semibold text-ink-700">{nichePathLabel(niches, selectedId)}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-3">
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
          <label htmlFor="new-niche-parent" className="text-xs font-semibold text-ink-700">
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
        <Button variant="primary" onClick={createAndUse} disabled={busy}>
          Create &amp; use this niche
        </Button>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-cream-200 pt-3">
        {allowNone ? (
          <Button variant="ghost" onClick={() => onConfirm(null)} disabled={busy}>
            Clear niche
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={busy || selectedId === null}
          onClick={() => selectedId && onConfirm(selectedId)}
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
 * a subniche can be made without a detour through the niche manager.
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
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (nicheId: string | null) => void;
  workspace: Workspace;
  title: string;
  description: string;
  confirmLabel: string;
  /** Move flows may clear the niche; add flows must land somewhere. */
  allowNone?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <NichePickerBody
        workspace={workspace}
        onConfirm={onConfirm}
        onClose={onClose}
        confirmLabel={confirmLabel}
        allowNone={allowNone}
      />
    </Modal>
  );
}
