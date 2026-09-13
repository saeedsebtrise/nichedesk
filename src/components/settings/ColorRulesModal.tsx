"use client";

import { useState, type ReactNode } from "react";

import { Check } from "@/components/marketing/icons";
import { ColorBadge } from "@/components/ui/ColorBadge";
import { Button, Modal, TextInput } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import {
  COLOR_PRESETS,
  DEFAULT_COLOR_SETTINGS,
  normalizeVolumeRules,
  type ColorSettings,
} from "@/features/settings/colors";
import { normalizeRules } from "@/features/settings/competition";
import type { Workspace } from "@/features/workspace/useWorkspace";
import { cn, formatNumber } from "@/lib/utils";

const toNumber = (raw: string) => Number.parseInt(raw.replace(/\D/g, ""), 10) || 0;

function NumberField({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <TextInput
      inputMode="numeric"
      aria-label={label}
      value={formatNumber(value)}
      onChange={(event) => onChange(toNumber(event.target.value))}
      className="max-w-28 py-1 text-sm font-semibold tabular-nums"
    />
  );
}

/** The ready-made colours and a free colour picker. */
function Palette({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  return (
    <div role="group" aria-label={`Colour for ${label}`} className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {COLOR_PRESETS.map((preset) => {
        const active = preset.hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={preset.hex}
            type="button"
            title={preset.name}
            aria-label={preset.name}
            aria-pressed={active}
            onClick={() => onChange(preset.hex)}
            className={cn(
              "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-night-900 transition-transform hover:scale-110",
              active ? "ring-2 ring-white" : "ring-1 ring-white/15",
            )}
            style={{ backgroundColor: preset.hex }}
          >
            {active ? <Check className="size-3.5 mix-blend-difference" strokeWidth={3} /> : null}
          </button>
        );
      })}
      <label className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-1 text-xs font-semibold text-cream-200/70 hover:bg-white/[0.08]">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
        Any colour
      </label>
    </div>
  );
}

function BandRow({
  color,
  sample,
  open,
  onToggle,
  onColor,
  name,
  children,
}: {
  color: string;
  sample: number;
  open: boolean;
  onToggle: () => void;
  onColor: (hex: string) => void;
  name: string;
  children: ReactNode;
}) {
  return (
    <li className={cn("rounded-xl border p-2.5 transition-colors", open ? "border-white/15 bg-white/[0.04]" : "border-white/[0.07]")}>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`Change the colour for ${name}`}
          className="size-8 shrink-0 rounded-lg ring-1 ring-white/20 transition-transform hover:scale-105"
          style={{ backgroundColor: color }}
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-cream-200/75">{children}</div>
        <ColorBadge color={color}>{formatNumber(sample)}</ColorBadge>
      </div>
      {open ? <Palette value={color} onChange={onColor} label={name} /> : null}
    </li>
  );
}

function ColorRulesEditor({ workspace, onDone }: { workspace: Workspace; onDone: () => void }) {
  const toast = useToast();
  const { settings } = workspace;
  const [draft, setDraft] = useState<ColorSettings>({
    competitionRules: settings.competitionRules,
    volumeRules: settings.volumeRules,
    colors: settings.colors,
  });
  const [openRow, setOpenRow] = useState<string | null>(null);

  const { volumeRules: volume, competitionRules: competition, colors } = draft;
  const toggle = (id: string) => setOpenRow((current) => (current === id ? null : id));
  const setVolume = (patch: Partial<typeof volume>) => setDraft({ ...draft, volumeRules: { ...volume, ...patch } });
  const setCompetition = (patch: Partial<typeof competition>) =>
    setDraft({ ...draft, competitionRules: { ...competition, ...patch } });
  const setColor = (group: "volume" | "competition", band: string, hex: string) =>
    setDraft({ ...draft, colors: { ...colors, [group]: { ...colors[group], [band]: hex } } });

  const save = async () => {
    const saved = await workspace.saveSettings({
      volumeRules: normalizeVolumeRules(volume),
      competitionRules: normalizeRules(competition),
      colors,
    });
    if (!saved) return;
    toast({ tone: "success", title: "Colours saved", detail: "Every volume and competition number now uses them." });
    onDone();
  };

  const sorted = normalizeVolumeRules(volume);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="volume-colours">
          <h3 id="volume-colours" className="font-semibold text-white">
            Search volume
          </h3>
          <p className="mt-0.5 text-xs text-cream-200/50">More searches is better.</p>
          <ul className="mt-3 space-y-2">
            <BandRow
              name="high volume"
              color={colors.volume.high}
              sample={sorted.high + 1}
              open={openRow === "volume-high"}
              onToggle={() => toggle("volume-high")}
              onColor={(hex) => setColor("volume", "high", hex)}
            >
              Above <NumberField label="High volume starts above" value={volume.high} onChange={(high) => setVolume({ high })} />
            </BandRow>
            <BandRow
              name="middle volume"
              color={colors.volume.mid}
              sample={Math.round((sorted.low + sorted.high) / 2)}
              open={openRow === "volume-mid"}
              onToggle={() => toggle("volume-mid")}
              onColor={(hex) => setColor("volume", "mid", hex)}
            >
              From <b className="text-white tabular-nums">{formatNumber(sorted.low)}</b> to{" "}
              <b className="text-white tabular-nums">{formatNumber(sorted.high)}</b>
            </BandRow>
            <BandRow
              name="low volume"
              color={colors.volume.low}
              sample={Math.max(0, sorted.low - 1)}
              open={openRow === "volume-low"}
              onToggle={() => toggle("volume-low")}
              onColor={(hex) => setColor("volume", "low", hex)}
            >
              Below <NumberField label="Low volume is below" value={volume.low} onChange={(low) => setVolume({ low })} />
            </BandRow>
          </ul>
        </section>

        <section aria-labelledby="competition-colours">
          <h3 id="competition-colours" className="font-semibold text-white">
            Competition
          </h3>
          <p className="mt-0.5 text-xs text-cream-200/50">Fewer competing listings is better.</p>
          <ul className="mt-3 space-y-2">
            <BandRow
              name="low competition"
              color={colors.competition.green}
              sample={Math.max(0, competition.green - 1)}
              open={openRow === "competition-green"}
              onToggle={() => toggle("competition-green")}
              onColor={(hex) => setColor("competition", "green", hex)}
            >
              Below <NumberField label="Low competition is below" value={competition.green} onChange={(green) => setCompetition({ green })} />
            </BandRow>
            <BandRow
              name="moderate competition"
              color={colors.competition.lightGreen}
              sample={competition.lightGreen}
              open={openRow === "competition-lightGreen"}
              onToggle={() => toggle("competition-lightGreen")}
              onColor={(hex) => setColor("competition", "lightGreen", hex)}
            >
              Up to{" "}
              <NumberField
                label="Moderate competition goes up to"
                value={competition.lightGreen}
                onChange={(lightGreen) => setCompetition({ lightGreen })}
              />
            </BandRow>
            <BandRow
              name="high competition"
              color={colors.competition.orange}
              sample={competition.orange}
              open={openRow === "competition-orange"}
              onToggle={() => toggle("competition-orange")}
              onColor={(hex) => setColor("competition", "orange", hex)}
            >
              Up to <NumberField label="High competition goes up to" value={competition.orange} onChange={(orange) => setCompetition({ orange })} />
            </BandRow>
            <BandRow
              name="very high competition"
              color={colors.competition.red}
              sample={competition.orange + 1}
              open={openRow === "competition-red"}
              onToggle={() => toggle("competition-red")}
              onColor={(hex) => setColor("competition", "red", hex)}
            >
              Above <b className="text-white tabular-nums">{formatNumber(competition.orange)}</b>
            </BandRow>
          </ul>
        </section>
      </div>

      <p className="text-xs text-cream-200/45">Click a colour square to change it. Numbers typed out of order are put in order when you save.</p>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
        <Button variant="quiet" onClick={() => setDraft(DEFAULT_COLOR_SETTINGS)}>
          Reset to defaults
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="primary" disabled={workspace.busy} onClick={save}>
            Save colours
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Where users choose the cut-offs and colours for volume and competition. */
export function ColorRulesModal({ open, onClose, workspace }: { open: boolean; onClose: () => void; workspace: Workspace }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Colour rules"
      description="Set your own numbers and pick a colour for each band. Volume and competition numbers across NicheDesk use them."
      width="max-w-4xl"
    >
      <ColorRulesEditor workspace={workspace} onDone={onClose} />
    </Modal>
  );
}
