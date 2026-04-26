import { useEffect, useState } from "react";
import { Check, Timer } from "lucide-react";
import type { Area } from "../types";
import { useApp } from "../state/AppContext";
import { Bank } from "./Bank";

export function HabitsView({ area }: { area: Area }) {
  const { state, dispatch } = useApp();
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  const activeDiscounts = state.pendingBonusQueue.filter(
    (s) => s.areaId === area.id && s.state === "active_discount"
  );

  const habitDiscount = (habitId: string) =>
    activeDiscounts.find((d) => d.habitId === habitId);

  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-semibold mb-2">Today's habits</h2>
        <div className="space-y-2">
          {area.habits.map((h, i) => {
            const checked = area.dailyState.completedHabitIds.includes(h.id);
            const discount = habitDiscount(h.id);
            return (
              <div key={h.id} className="space-y-2">
                <button
                  className={[
                    "card w-full p-4 flex items-center justify-between text-left transition",
                    checked
                      ? "opacity-60"
                      : "hover:border-amber-400 hover:shadow",
                  ].join(" ")}
                  onClick={() => {
                    if (checked) {
                      setTooltipIdx(i);
                      window.setTimeout(() => setTooltipIdx(null), 2200);
                      return;
                    }
                    dispatch({
                      type: "checkHabit",
                      areaId: area.id,
                      habitId: h.id,
                    });
                  }}
                >
                  <div>
                    <div className="font-medium">{h.name}</div>
                    <div className="text-sm text-slate-500">
                      Do {h.effortNumber} {h.effortUnit}
                    </div>
                  </div>
                  <div
                    className={[
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition",
                      checked
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "border-slate-300 dark:border-slate-600",
                    ].join(" ")}
                  >
                    {checked && <Check className="w-4 h-4" />}
                  </div>
                </button>

                {tooltipIdx === i && checked && (
                  <p className="text-xs text-slate-500 px-2">
                    Already done today — habits can't be unchecked. Wait for
                    the daily reset.
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
      <button
        className="btn-primary"
        onClick={onClaim}
      >
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
