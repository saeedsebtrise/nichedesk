"use client";

import { useMemo, useState } from "react";

import { NicheTreeSelect } from "@/components/niches/NicheTree";
import { Banner, Button, FieldLabel, Modal, TextInput } from "@/components/ui/primitives";
import { canReparent, flattenTree, withDescendantIds } from "@/features/niches/tree";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

/**
 * The editor body — mounted only while the dialog is open, so every open starts
 * with a clean form rather than resetting state from an effect.
 *
 * Keyword counts are shown twice: the niche's own keywords and the rolled-up
 * total including subniches. That difference is the whole point of nesting, and
 * it decides which delete mode a user wants.
 */
function NicheManagerBody({
  onClose,
  workspace,
}: {
  onClose: () => void;
  workspace: Workspace;
}) {
  const { tree, niches, keywords, busy } = workspace;

  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string | "all" | "none">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const nodes = useMemo(() => flattenTree(tree), [tree]);

  const counts = useMemo(() => {
    const own = new Map<string, number>();
    for (const keyword of keywords) {
      if (!keyword.nicheId) continue;
      own.set(keyword.nicheId, (own.get(keyword.nicheId) ?? 0) + 1);
    }

    const total = new Map<string, number>();
    for (const niche of niches) {
      let sum = 0;
      for (const id of withDescendantIds(niches, niche.id)) sum += own.get(id) ?? 0;
      total.set(niche.id, sum);
    }

    return { own, total };
  }, [keywords, niches]);

  const addNiche = async () => {
    if (newName.trim() === "") {
      setLocalError("Give the niche a name.");
      return;
    }

    setLocalError(null);
    const parentId = newParentId === "none" || newParentId === "all" ? null : newParentId;
    const created = await workspace.createNiche(newName.trim(), parentId);
    if (created) setNewName("");
  };

  const saveRename = async (id: string) => {
    if (editingName.trim() === "") {
      setLocalError("A niche needs a name.");
      return;
    }

    const saved = await workspace.renameNiche(id, editingName.trim());
    if (saved) setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {workspace.error ?? localError ? (
        <Banner tone="error">{localError ?? workspace.error}</Banner>
      ) : null}

      <div className="space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-3">
        <FieldLabel>Add a niche</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          <TextInput
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. christmas png"
            aria-label="New niche name"
            className="min-w-48 flex-1"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addNiche();
              }
            }}
          />
          <NicheTreeSelect
            tree={tree}
            value={newParentId}
            onChange={setNewParentId}
            noneLabel="Top level (no parent)"
            className="min-w-44"
          />
          <Button variant="primary" onClick={addNiche} disabled={busy}>
            Add
          </Button>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cream-300 px-3 py-8 text-center text-sm text-ink-500">
          No niches yet. Add your first one above — then nest subniches under it.
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-cream-100 overflow-y-auto rounded-xl border border-cream-200 bg-white">
          {nodes.map((node) => {
            const own = counts.own.get(node.id) ?? 0;
            const total = counts.total.get(node.id) ?? 0;
            const rolledUp = total - own;
            const editing = editingId === node.id;
            const confirming = confirmDeleteId === node.id;

            return (
              <li key={node.id} className="px-3 py-2.5">
                <div
                  className="flex flex-wrap items-center gap-2"
                  style={{ paddingLeft: node.depth * 18 }}
                >
                  {node.depth > 0 ? (
                    <span aria-hidden="true" className="text-ink-500">
                      └
                    </span>
                  ) : null}

                  {editing ? (
                    <>
                      <TextInput
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        aria-label={`Rename ${node.name}`}
                        className="min-w-40 flex-1"
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveRename(node.id);
                          }
                          if (event.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button variant="primary" onClick={() => saveRename(node.id)} disabled={busy}>
                        Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "truncate text-sm font-semibold",
                          node.depth === 0 ? "text-ink-900" : "text-ink-700",
                        )}
                      >
                        {node.name}
                      </span>
                      <span className="tabular text-[11px] text-ink-500">
                        {formatNumber(own)} keyword{own === 1 ? "" : "s"}
                        {rolledUp > 0 ? ` · +${formatNumber(rolledUp)} in subniches` : ""}
                      </span>

                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <label className="sr-only" htmlFor={`parent-${node.id}`}>
                          Nest {node.name} under
                        </label>
                        <NicheTreeSelect
                          id={`parent-${node.id}`}
                          tree={tree}
                          value={node.parentId ?? "none"}
                          onChange={(value) =>
                            workspace.moveNiche(
                              node.id,
                              value === "none" || value === "all" ? null : value,
                            )
                          }
                          noneLabel="Top level"
                          // A niche cannot be nested inside itself or its own subtree.
                          disabledIds={
                            new Set(
                              niches
                                .filter((candidate) => !canReparent(niches, node.id, candidate.id))
                                .map((candidate) => candidate.id),
                            )
                          }
                          className="max-w-40 py-1 text-xs"
                        />
                        <Button
                          variant="ghost"
                          className="px-2.5 py-1 text-xs"
                          onClick={() => {
                            setEditingId(node.id);
                            setEditingName(node.name);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2.5 py-1 text-xs text-red-700"
                          onClick={() => setConfirmDeleteId(confirming ? null : node.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {confirming ? (
                  <div className="mt-2 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <p>
                      Delete <span className="font-semibold">{node.name}</span>?
                      {node.children.length > 0 || total > 0
                        ? " Choose what happens to what is inside."
                        : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        className="text-xs"
                        disabled={busy}
                        onClick={async () => {
                          await workspace.deleteNiche(node.id, "reparent");
                          setConfirmDeleteId(null);
                        }}
                      >
                        Keep contents — move up a level
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs"
                        disabled={busy}
                        onClick={async () => {
                          await workspace.deleteNiche(node.id, "cascade");
                          setConfirmDeleteId(null);
                        }}
                      >
                        Delete subniches &amp; {formatNumber(total)} keyword{total === 1 ? "" : "s"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end border-t border-cream-200 pt-3">
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

/** The niche tree editor: add a niche or subniche, rename, re-nest, delete. */
export function NicheManagerModal({
  open,
  onClose,
  workspace,
}: {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Niches"
      description="Build your niche tree — nest a subniche under any parent, or re-nest one later."
      width="max-w-2xl"
    >
      <NicheManagerBody onClose={onClose} workspace={workspace} />
    </Modal>
  );
}
