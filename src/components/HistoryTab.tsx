import { useState } from "react";
import { useApp } from "../state/AppContext";
import { areaAccentClasses, formatRelative } from "../lib/util";
import type { HistoryEntry } from "../types";

export function HistoryTab() {
  const { state } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? state.history
      : state.history.filter((e) => e.areaId === filter);

  return (
    <div className="space-y-3">
      <div className="card p-1 flex gap-1 overflow-x-auto">
        <FilterPill
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {state.areas.map((a, i) => {
          const accent = areaAccentClasses(i);
          return (
            <FilterPill
              key={a.id}
              label={a.name || `Area ${i + 1}`}
              dot={accent.dot}
              active={filter === a.id}
              onClick={() => setFilter(a.id)}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          No events yet.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const areaIdx = state.areas.findIndex((a) => a.id === e.areaId);
            const area = state.areas[areaIdx];
            const accent = areaAccentClasses(areaIdx);
            return (
              <button
                key={e.id}
                className="card w-full text-left p-3 hover:border-amber-400"
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className={["w-2 h-2 rounded-full flex-shrink-0", accent.dot].join(" ")} />
                    <div className="min-w-0">
                      <div className="text-sm">
                        {entrySummary(e, area?.habits ?? [])}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatRelative(e.timestamp)} ·{" "}
                        {area?.name ?? "deleted area"}
                      </div>
                    </div>
                  </div>
                </div>
                {expanded === e.id && (
                  <pre className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs overflow-x-auto">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      className={[
        "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5",
        active
          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      ].join(" ")}
      onClick={onClick}
    >
      {dot && <span className={["w-2 h-2 rounded-full", dot].join(" ")} />}
      {label}
    </button>
  );
}

function entrySummary(
  e: HistoryEntry,
  habits: { id: string; name: string; dailyTarget?: number }[]
): string {
  const habitName = (id: string | undefined) => {
    if (!id) return "";
    if (id === "deleted") return "deleted habit";
    return habits.find((h) => h.id === id)?.name ?? "deleted habit";
  };
  const habitTarget = (id: string | undefined) =>
    habits.find((h) => h.id === id)?.dailyTarget;

  switch (e.type) {
    case "habit_completed": {
      const p = e.payload as {
        habitId?: string;
        completionNumber?: number;
        clipsEarned?: number;
        goldCount?: number;
      };
      const name = habitName(p.habitId);
      // Old-format entries (no completionNumber/clipsEarned) → simple summary
      if (p.completionNumber === undefined || p.clipsEarned === undefined) {
        return `✅ Completed ${name}`;
      }
      const target = habitTarget(p.habitId);
      const setLabel = target
        ? `(set ${p.completionNumber} of ${target}) `
        : `(set ${p.completionNumber}) `;
      const sparkle = (p.goldCount ?? 0) > 0 ? " ✨" : "";
      return `✅ Completed ${name} ${setLabel}→ ${p.clipsEarned} clip${
        p.clipsEarned === 1 ? "" : "s"
      }${sparkle}`;
    }
    case "spin": {
      const p = e.payload as {
        rolledSegment: string;
        paidReward:
          | { name: string; amount: number; unit: string; tier: string }
          | null;
        loss?: boolean;
        nearMiss?: boolean;
      };
      if (p.loss) {
        return `💸 Loss — landed ${p.rolledSegment.toUpperCase()}, no reward (clips cashed into jar)`;
      }
      // Legacy entries from before the loss change had a paid T1 + nearMiss flag.
      if (p.nearMiss && p.paidReward) {
        const t = p.paidReward.tier.toUpperCase();
        const r = `${p.paidReward.name}, ${p.paidReward.amount} ${p.paidReward.unit}`;
        return `😬 Near miss — landed ${p.rolledSegment.toUpperCase()} but paid ${t}: ${r}`;
      }
      if (!p.paidReward) {
        return `🎰 Spun ${p.rolledSegment.toUpperCase()}`;
      }
      const tier = p.paidReward.tier.toUpperCase();
      const reward = `${p.paidReward.name}, ${p.paidReward.amount} ${p.paidReward.unit}`;
      if (p.rolledSegment === "jackpot") return `🎉 JACKPOT — ${reward}`;
      if (p.rolledSegment === "bonus")
        return `🎰 Bonus landed — paid ${tier}: ${reward}`;
      return `🎰 Spun ${tier} — ${reward}`;
    }
    case "bonus_free_clip":
      return `🎁 Bonus round: free clip`;
    case "bonus_discount": {
      const p = e.payload as {
        outcome: string;
        habitId?: string;
        discountPercent?: number;
        effortRequired?: number;
      };
      if (p.outcome === "started")
        return `⏱ Bonus discount started: ${p.discountPercent}% off ${habitName(p.habitId)}`;
      if (p.outcome === "claimed")
        return `✅ Bonus discount claimed (${habitName(p.habitId)})`;
      if (p.outcome === "expired") return `⏱ Bonus discount expired`;
      return `Bonus discount ${p.outcome}`;
    }
    case "bonus_main":
      return `Bonus round started`;
    case "milestone_hit": {
      const p = e.payload as { rewardName: string; target: number };
      return `🏆 Milestone hit: ${p.rewardName} (${p.target} clips)`;
    }
    case "naked_use": {
      const p = e.payload as {
        tier: string;
        bankRemoved: number;
        jarRemoved: number;
      };
      return `🫥 Naked use logged (${p.tier.toUpperCase()}) — bank -${p.bankRemoved}, jar -${p.jarRemoved}`;
    }
    default:
      return e.type;
  }
}
