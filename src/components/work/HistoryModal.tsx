"use client";

import { MovementBadge } from "@/components/ui/Movement";
import { Modal } from "@/components/ui/primitives";
import { percentChange, snapshotsOf } from "@/features/keywords/history";
import type { Keyword, Snapshot } from "@/features/keywords/types";
import { formatNumber } from "@/lib/utils";

const WIDTH = 560;
const HEIGHT = 200;
const PAD = { top: 18, right: 56, bottom: 30, left: 56 };

const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** Volume (solid, left axis) and competition (dashed, right axis), each on its own scale. */
function Chart({ readings }: { readings: Snapshot[] }) {
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const bottom = PAD.top + innerHeight;
  const x = (index: number) =>
    PAD.left + (readings.length === 1 ? innerWidth / 2 : (index / (readings.length - 1)) * innerWidth);

  const axis = (values: number[]) => {
    const low = Math.min(...values);
    const high = Math.max(...values);
    const [min, max] = low === high ? [low - 1, high + 1] : [low, high];
    return { low, high, y: (value: number) => PAD.top + (1 - (value - min) / (max - min)) * innerHeight };
  };
  const volume = axis(readings.map((reading) => reading.volume));
  const competition = axis(readings.map((reading) => reading.competition));

  const path = (y: (value: number) => number, key: "volume" | "competition") =>
    readings.map((reading, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(reading[key]).toFixed(1)}`).join(" ");
  const volumeLine = path(volume.y, "volume");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Search volume and competition over time">
      <defs>
        <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4671f" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f4671f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((share) => (
        <line
          key={share}
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + share * innerHeight}
          y2={PAD.top + share * innerHeight}
          stroke="rgba(255,255,255,0.07)"
        />
      ))}

      {readings.length > 1 ? (
        <path d={`${volumeLine} L${x(readings.length - 1).toFixed(1)} ${bottom} L${x(0).toFixed(1)} ${bottom} Z`} fill="url(#history-area)" />
      ) : null}
      <path d={volumeLine} fill="none" stroke="#f4671f" strokeWidth={2.5} strokeLinejoin="round" />
      <path
        d={path(competition.y, "competition")}
        fill="none"
        stroke="#5eead4"
        strokeWidth={2}
        strokeDasharray="5 4"
        strokeLinejoin="round"
      />

      {readings.map((reading, index) => (
        <g key={reading.at}>
          <circle cx={x(index)} cy={volume.y(reading.volume)} r={4} fill="#f4671f" stroke="#150e0a" strokeWidth={2} />
          <circle cx={x(index)} cy={competition.y(reading.competition)} r={3.5} fill="#5eead4" stroke="#150e0a" strokeWidth={2} />
        </g>
      ))}

      <g fontSize="11" fontWeight="600">
        <text x={PAD.left - 8} y={volume.y(volume.high) + 4} textAnchor="end" fill="#ffab7d">
          {compact(volume.high)}
        </text>
        {volume.low !== volume.high ? (
          <text x={PAD.left - 8} y={volume.y(volume.low) + 4} textAnchor="end" fill="#ffab7d">
            {compact(volume.low)}
          </text>
        ) : null}
        <text x={WIDTH - PAD.right + 8} y={competition.y(competition.high) + 4} fill="#5eead4">
          {compact(competition.high)}
        </text>
        {competition.low !== competition.high ? (
          <text x={WIDTH - PAD.right + 8} y={competition.y(competition.low) + 4} fill="#5eead4">
            {compact(competition.low)}
          </text>
        ) : null}
        <text x={x(0)} y={HEIGHT - 8} textAnchor={readings.length === 1 ? "middle" : "start"} fill="rgba(243,223,207,0.5)">
          {longDay(readings[0].at)}
        </text>
        {readings.length > 1 ? (
          <text x={x(readings.length - 1)} y={HEIGHT - 8} textAnchor="end" fill="rgba(243,223,207,0.5)">
            {longDay(readings[readings.length - 1].at)}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/** Every reading of one keyword: a chart of the trend, and the numbers behind it. */
export function HistoryModal({ keyword, onClose }: { keyword: Keyword | null; onClose: () => void }) {
  const readings = keyword ? snapshotsOf(keyword) : [];
  const newestFirst = [...readings].reverse();

  return (
    <Modal
      open={keyword !== null}
      onClose={onClose}
      title={keyword?.keyword ?? "History"}
      description={
        readings.length > 1 ? `${readings.length} readings since ${longDay(readings[0].at)}` : "One reading so far"
      }
      width="max-w-2xl"
    >
      {keyword ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-night-950/50 p-3">
            <Chart readings={readings} />
          </div>

          <ul className="flex flex-wrap gap-4 text-xs text-cream-200/60">
            <li className="flex items-center gap-2">
              <span className="h-0.5 w-6 rounded bg-brand-500" /> Search volume
            </li>
            <li className="flex items-center gap-2">
              <span className="h-0 w-6 border-t-2 border-dashed border-teal-300" /> Competition
            </li>
          </ul>

          {readings.length === 1 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-cream-200/60">
              Import this keyword again from a fresh eRank export — every import adds a reading, and the lines start to show
              where it is heading.
            </p>
          ) : null}

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase">
                <th scope="col" className="py-2">
                  Reading
                </th>
                <th scope="col" className="py-2 text-right">
                  Volume
                </th>
                <th scope="col" className="py-2 text-right">
                  Competition
                </th>
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((reading, index) => {
                const previous = newestFirst[index + 1];
                return (
                  <tr key={reading.at} className="border-t border-white/[0.06]">
                    <td className="py-2 text-cream-200/70">{longDay(reading.at)}</td>
                    <td className="py-2 text-right">
                      <span className="tabular text-white">{formatNumber(reading.volume)}</span>
                      {previous ? (
                        <MovementBadge change={percentChange(previous.volume, reading.volume)} goodWhen="up" className="ml-2" />
                      ) : null}
                    </td>
                    <td className="py-2 text-right">
                      <span className="tabular text-white">{formatNumber(reading.competition)}</span>
                      {previous ? (
                        <MovementBadge
                          change={percentChange(previous.competition, reading.competition)}
                          goodWhen="down"
                          className="ml-2"
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Modal>
  );
}
