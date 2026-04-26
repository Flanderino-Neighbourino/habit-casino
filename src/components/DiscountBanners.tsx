import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useApp } from "../state/AppContext";

export function DiscountBanners() {
  const { state, dispatch } = useApp();
  const active = state.pendingBonusQueue
    .filter((s) => s.state === "active_discount")
    .slice(0, 3);

  if (active.length === 0) return null;

  return (
    <div className="z-40 space-y-1 px-2 pt-2 max-w-3xl mx-auto w-full">
      {active.map((s) => {
        const area = state.areas.find((a) => a.id === s.areaId);
        const habit = area?.habits.find((h) => h.id === s.habitId);
        if (!area || !habit) return null;
        return (
          <DiscountBanner
            key={s.id}
            areaName={area.name}
            label={`do ${s.effortRequired} ${habit.effortUnit}`}
            expiresAt={s.expiresAt!}
            onClaim={() =>
              dispatch({ type: "claimDiscountClip", bonusStepId: s.id })
            }
          />
        );
      })}
    </div>
  );
}

function DiscountBanner({
  areaName,
  label,
  expiresAt,
  onClaim,
}: {
  areaName: string;
  label: string;
  expiresAt: string;
  onClaim: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(expiresAt).getTime() - now);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <div className="card flex items-center justify-between p-2 px-3 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800">
      <div className="text-sm">
        <span className="font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" />
          Bonus active ({areaName})
        </span>
        <span className="text-amber-700 dark:text-amber-300">
          : {label} · {m}:{String(s).padStart(2, "0")}
        </span>
      </div>
      <button className="btn-primary text-xs py-1 px-2" onClick={onClaim}>
        Claim
      </button>
    </div>
  );
}
