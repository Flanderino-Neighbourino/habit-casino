import { useState } from "react";
import { Lock, Trophy } from "lucide-react";
import type { Area, RewardTier } from "../types";
import { useApp } from "../state/AppContext";
import { Modal } from "./Modal";
import { unitLabel } from "../lib/util";

export function JarView({ area, areaIndex }: { area: Area; areaIndex: number }) {
  return (
    <div className="space-y-4">
      <Jar area={area} areaIndex={areaIndex} />
      <RewardsAndConfessions area={area} />
    </div>
  );
}

function Jar({ area, areaIndex }: { area: Area; areaIndex: number }) {
  const { dispatch } = useApp();
  const total = area.jar.length;
  const max = Math.max(area.milestones[2].target, total);
  const renderClips = Math.min(total, 200);

  const accentByIdx = ["#22c55e", "#3b82f6", "#a855f7"][areaIndex] ?? "#22c55e";

  return (
    <section className="card p-4">
      <h2 className="font-semibold mb-3">Jar</h2>
      <div className="relative mx-auto" style={{ width: 240, height: 360 }}>
        <svg viewBox="0 0 240 360" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentByIdx} stopOpacity="0.05" />
              <stop offset="50%" stopColor={accentByIdx} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accentByIdx} stopOpacity="0.05" />
            </linearGradient>
            <clipPath id="jarClip">
              <path d="M40 40 Q40 30 50 30 L190 30 Q200 30 200 40 L200 60 Q210 70 210 90 L210 320 Q210 340 190 340 L50 340 Q30 340 30 320 L30 90 Q30 70 40 60 Z" />
            </clipPath>
          </defs>

          <path
            d="M40 40 Q40 30 50 30 L190 30 Q200 30 200 40 L200 60 Q210 70 210 90 L210 320 Q210 340 190 340 L50 340 Q30 340 30 320 L30 90 Q30 70 40 60 Z"
            fill="url(#glassGrad)"
            stroke={accentByIdx}
            strokeWidth="2"
            opacity="0.9"
          />

          <g clipPath="url(#jarClip)">
            {area.jar.slice(0, renderClips).map((c, i) => {
              const x = 50 + ((i * 13) % 150);
              const y = 330 - Math.floor(i / 12) * 14 + ((i * 7) % 6);
              return (
                <circle
                  key={c.id}
                  cx={x}
                  cy={y}
                  r={5.5}
                  fill={clipFill(c.color)}
                  opacity={0.95}
                />
              );
            })}

            {area.milestones.map((m, i) => {
              const yPct = 1 - m.target / max;
              const y = 30 + 310 * yPct;
              const hit = total >= m.target;
              return (
                <g key={i}>
                  <line
                    x1={20}
                    x2={220}
                    y1={y}
                    y2={y}
                    stroke={hit ? "#fbbf24" : "#94a3b8"}
                    strokeDasharray={hit ? undefined : "4 4"}
                    strokeWidth={hit ? 2 : 1.5}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {total > 200 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full">
              {total} clips
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-3">
        {area.milestones.map((m, i) => {
          const hit = total >= m.target;
          const claimed = !!m.claimed;
          return (
            <div
              key={i}
              className={[
                "flex items-center justify-between p-2 rounded-lg border",
                hit
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                  : "border-slate-200 dark:border-slate-800",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                {hit ? (
                  <Trophy className="w-4 h-4 text-amber-500" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-sm font-medium">{m.rewardName}</div>
                  <div className="text-xs text-slate-500">
                    {Math.min(total, m.target)} / {m.target} clips
                  </div>
                </div>
              </div>
              {hit && !claimed && (
                <button
                  className="btn-primary text-sm"
                  onClick={() =>
                    dispatch({
                      type: "claimMilestone",
                      areaId: area.id,
                      milestoneIndex: i,
                    })
                  }
                >
                  🎉 Claim
                </button>
              )}
              {hit && claimed && (
                <span className="chip">Unlocked</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function clipFill(color: string): string {
  switch (color) {
    case "red":
      return "#ef4444";
    case "blue":
      return "#3b82f6";
    case "green":
      return "#22c55e";
    case "yellow":
      return "#eab308";
    case "purple":
      return "#a855f7";
    case "orange":
      return "#f97316";
    case "gold":
      return "#fbbf24";
    default:
      return "#94a3b8";
  }
}

function RewardsAndConfessions({ area }: { area: Area }) {
  const { dispatch } = useApp();
  const [confirm, setConfirm] = useState<RewardTier | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tiers: { tier: RewardTier; label: string }[] = [
    { tier: "t1", label: "T1" },
    { tier: "t2", label: "T2" },
    { tier: "t3", label: "T3" },
    { tier: "jackpot", label: "Jackpot" },
  ];

  return (
    <section className="card p-4">
      <h2 className="font-semibold mb-2">Rewards & confessions</h2>
      <p className="text-xs text-slate-500 mb-3">
        Tap "I used this naked" to log that you enjoyed a reward without
        earning it. Penalties apply.
      </p>
      <div className="space-y-2">
        {tiers.map(({ tier, label }) => {
          const r = area.rewards[tier];
          return (
            <div
              key={tier}
              className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {label}
                </div>
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-slate-500">
                  {r.amountNumber} {unitLabel(r.amountUnit)}
                </div>
              </div>
              <button
                className="btn-secondary text-sm whitespace-nowrap"
                onClick={() => setConfirm(tier)}
              >
                I used this naked
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Confess naked use?"
        size="sm"
      >
        {confirm && (
          <div className="space-y-3">
            <p className="text-sm">
              This will remove clips from your bank and jar:
            </p>
            <ul className="text-sm list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>Bank: -{bankPenalty(confirm)} random clips</li>
              <li>Jar: -{jarPenalty(confirm)} clips</li>
            </ul>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-primary bg-red-500 text-white hover:bg-red-400"
                onClick={() => {
                  dispatch({ type: "nakedUse", areaId: area.id, tier: confirm });
                  setConfirm(null);
                  setToast("Logged. Back to it.");
                  window.setTimeout(() => setToast(null), 2200);
                }}
              >
                Confess
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-40">
          {toast}
        </div>
      )}
    </section>
  );
}

function bankPenalty(t: RewardTier): number {
  return { t1: 1, t2: 2, t3: 3, jackpot: 5 }[t];
}
function jarPenalty(t: RewardTier): number {
  return { t1: 2, t2: 4, t3: 6, jackpot: 10 }[t];
}
