"use client";

import { useState } from "react";

import { NicheTreeSelect } from "@/components/niches/NicheTree";
import { Banner, Button, FieldLabel, Modal, Select, TextInput } from "@/components/ui/primitives";
import { TRENDS, TYPES, type Keyword, type KeywordType, type Trend } from "@/features/keywords/types";
import type { Workspace } from "@/features/workspace/useWorkspace";

const toNumber = (raw: string): number => {
  const value = Number.parseInt(raw.replace(/[,\s]/g, ""), 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

/**
 * The form body.
 *
 * Kept separate from the dialog so it mounts fresh every time the dialog opens —
 * that is what initialises the fields, instead of resetting them from an effect.
 */
function KeywordForm({
  keyword,
  workspace,
  onClose,
}: {
  keyword: Keyword | null;
  workspace: Workspace;
  onClose: () => void;
}) {
  const [text, setText] = useState(keyword?.keyword ?? "");
  const [volume, setVolume] = useState(keyword ? String(keyword.volume) : "");
  const [competition, setCompetition] = useState(keyword ? String(keyword.competition) : "");
  const [nicheId, setNicheId] = useState<string | "all" | "none">(keyword?.nicheId ?? "none");
  const [trend, setTrend] = useState<Trend>(keyword?.trend ?? "Evergreen");
  const [type, setType] = useState<KeywordType>(keyword?.type ?? "White hat");
  const [localError, setLocalError] = useState<string | null>(null);

  const save = async () => {
    if (text.trim() === "") {
      setLocalError("Enter a keyword.");
      return;
    }

    setLocalError(null);
    const resolvedNiche = nicheId === "none" || nicheId === "all" ? null : nicheId;

    const saved = keyword
      ? await workspace.patchKeyword(keyword.id, {
          keyword: text.trim(),
          volume: toNumber(volume),
          competition: toNumber(competition),
          nicheId: resolvedNiche,
          trend,
          type,
        })
      : await workspace.addKeyword({
          keyword: text.trim(),
          volume: toNumber(volume),
          competition: toNumber(competition),
          nicheId: resolvedNiche,
        });

    if (saved) onClose();
  };

  return (
    <div className="space-y-3">
      {workspace.error ?? localError ? (
        <Banner tone="error">{localError ?? workspace.error}</Banner>
      ) : null}

      <label className="block space-y-1">
        <FieldLabel>Keyword</FieldLabel>
        <TextInput
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. christmas gnome png"
          autoFocus
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <FieldLabel>Volume</FieldLabel>
          <TextInput
            inputMode="numeric"
            value={volume}
            onChange={(event) => setVolume(event.target.value)}
            placeholder="0"
          />
        </label>
        <label className="block space-y-1">
          <FieldLabel>Competition</FieldLabel>
          <TextInput
            inputMode="numeric"
            value={competition}
            onChange={(event) => setCompetition(event.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      <div className="space-y-1">
        <FieldLabel>Niche</FieldLabel>
        <NicheTreeSelect
          tree={workspace.tree}
          value={nicheId}
          onChange={setNicheId}
          noneLabel="No niche"
          className="w-full"
        />
      </div>

      {keyword ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <FieldLabel>Trend</FieldLabel>
            <Select
              className="w-full"
              value={trend}
              onChange={(event) => setTrend(event.target.value as Trend)}
            >
              {TRENDS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1">
            <FieldLabel>Type</FieldLabel>
            <Select
              className="w-full"
              value={type}
              onChange={(event) => setType(event.target.value as KeywordType)}
            >
              {TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-cream-200 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={workspace.busy}>
          {keyword ? "Save changes" : "Add keyword"}
        </Button>
      </div>
    </div>
  );
}

/** Add a keyword by hand, or edit one already saved. */
export function KeywordFormModal({
  open,
  onClose,
  workspace,
  /** `null` means "add"; a keyword means "edit that one". */
  keyword,
}: {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
  keyword: Keyword | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={keyword ? "Edit keyword" : "Add keyword manually"}
      description={keyword ? "Update this keyword's numbers or move it to another niche." : undefined}
    >
      {/* Switching rows while the dialog is open must reload the fields. */}
      <KeywordForm
        key={keyword?.id ?? "new"}
        keyword={keyword}
        workspace={workspace}
        onClose={onClose}
      />
    </Modal>
  );
}
