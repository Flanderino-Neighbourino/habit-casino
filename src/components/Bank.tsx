import type { Clip, ClipColor } from "../types";
import { NON_GOLD_COLORS } from "../types";
import { ClipDot } from "./ClipDot";

export function Bank({ clips }: { clips: Clip[] }) {
  const counts: Record<ClipColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    orange: 0,
    gold: 0,
  };
  for (const c of clips) counts[c.color]++;

  const total = clips.length;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold">Bank</h3>
        <span className="text-xs text-slate-500">
          {total} clip{total === 1 ? "" : "s"}
        </span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-slate-500">
          Empty. Check off a habit to earn your first clip.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {NON_GOLD_COLORS.map((c) =>
            counts[c] > 0 ? (
              <div
                key={c}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <ClipDot color={c} />
                <span className="text-sm font-medium">{counts[c]}</span>
              </div>
            ) : null
          )}
          {counts.gold > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-400">
              <ClipDot color="gold" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {counts.gold} gold
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
