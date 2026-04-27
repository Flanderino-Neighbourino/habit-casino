import { useEffect, useRef, useState } from "react";
import { Check, Plus, Timer } from "lucide-react";
import type { Area } from "../types";
import { MAX_FLY_ANIMS } from "../types";
import { useApp } from "../state/AppContext";
import { Bank } from "./Bank";
import { ClipDot } from "./ClipDot";
import type { ClipColor } from "../types";
import { NON_GOLD_COLORS } from "../types";

type FlyingCluster = {
  id: number;
  habitId: string;
  colors: ClipColor[];
};

export function HabitsView({ area }: { area: Area }) {
  const { state, dispatch } = useApp();
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [flying, setFlying] = useState<FlyingCluster[]>([]);
  const nextFlyId = useRef(1);

  const activeDiscounts = state.pendingBonusQueue.filter(
    (s) => s.areaId === area.id && s.state === "active_discount"
  );
  const habitDiscount = (habitId: string) =>
    activeDiscounts.find((d) => d.habitId === habitId);

  const triggerFly = (habitId: string, count: number) => {
    const visible = Math.min(count, MAX_FLY_ANIMS);
    const colors: ClipColor[] = Array.from({ length: visible }, () =>
      Math.random() < 0.03
        ? "gold"
        : NON_GOLD_COLORS[Math.floor(Math.random() * NON_GOLD_COLORS.length)]
    );
    const id = nextFlyId.current++;
    setFlying((f) => [...f, { id, habitId, colors }]);
    const totalMs = 480 + 80 * visible;
    window.setTimeout(() => {
      setFlying((f) => f.filter((c) => c.id !== id));
    }, totalMs);
  };

  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-semibold mb-2">Today's habits</h2>
        <div className="space-y-2">
          {area.habits.map((h) => {
            const count = area.dailyState.completionCounts[h.id] ?? 0;
            const done = count >= h.dailyTarget;
            const discount = habitDiscount(h.id);
            const isSingle = h.dailyTarget === 1;

            const onTap = () => {
              if (done) {
                setTooltipId(h.id);
                window.setTimeout(() => setTooltipId(null), 2200);
                return;
              }
              dispatch({ type: "checkHabit", areaId: area.id, habitId: h.id });
              triggerFly(h.id, h.clipYield);
            };

            const cluster = flying.find((c) => c.habitId === h.id);

            return (
              <div key={h.id} className="space-y-2 relative">
                {cluster && (
                  <div className="pointer-events-none absolute top-3 right-3 z-10">
                    {cluster.colors.map((c, idx) => (
                      <span
                        key={idx}
                        className="absolute animate-clip-fly"
                        style={{
                          animationDelay: `${idx * 80}ms`,
                          ["--fly-x" as string]: `${-40 - Math.random() * 60}px`,
                          ["--fly-y" as string]: `${80 + Math.random() * 100}px`,
                        }}
                      >
                        <ClipDot color={c} size={12} />
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={[
                    "card p-4 flex items-center justify-between gap-3 transition",
                    done ? "opacity-60" : "hover:border-amber-400 hover:shadow",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{h.name}</div>
                    <div className="text-sm text-slate-500">
                      Do {h.effortNumber} {h.effortUnit}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="chip">📎 +{h.clipYield}</span>
                      <span className="chip">
                        {count} / {h.dailyTarget} today
                      </span>
                      {done && (
                        <span className="chip bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          ✅ Done for today
                        </span>
                      )}
                    </div>
                  </div>

                  {isSingle ? (
                    <button
                      onClick={onTap}
                      aria-label={done ? "Already done today" : "Mark done"}
                      className={[
                        "w-9 h-9 rounded-full border-2 flex items-center justify-center transition flex-shrink-0",
                        done
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-amber-400",
                      ].join(" ")}
                    >
                      {done && <Check className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button
                      onClick={onTap}
                      disabled={done}
                      className={[
                        "btn flex-shrink-0 whitespace-nowrap",
                        done
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          : "bg-amber-500 text-slate-950 hover:bg-amber-400",
                      ].join(" ")}
                    >
                      <Plus className="w-4 h-4" /> 1 done
                    </button>
                  )}
                </div>

                {tooltipId === h.id && done && (
                  <p className="text-xs text-slate-500 px-2">
                    Daily target reached. Resets at midnight.
                  </p>
                )}

                {discount && (
                  <DiscountRow
                    label={`Discount: do ~${discount.effortRequired} ${h.effortUnit}`}
                    expiresAt={discount.expiresAt!}
                    onClaim={() =>
                      dispatch({
                        type: "claimDiscountClip",
                        bonusStepId: discount.id,
                      })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Bank clips={area.bank} />
    </div>
  );
}

function DiscountRow({
  label,
  expiresAt,
  onClaim,
}: {
  label: string;
  expiresAt: string;
  onClaim: () => void;
}) {
  const remaining = useCountdown(expiresAt);
  return (
    <div className="card p-3 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800">
      <div>
        <div className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <Timer className="w-4 h-4" /> {label}
        </div>
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Expires in {remaining}
        </div>
      </div>
      <button className="btn-primary" onClick={onClaim}>
        Claim clip
      </button>
    </div>
  );
}

function useCountdown(expiresAtIso: string): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(expiresAtIso).getTime() - now);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
