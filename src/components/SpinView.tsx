import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, ClipColor, SpinPayload } from "../types";
import { NON_GOLD_COLORS } from "../types";
import { useApp } from "../state/AppContext";
import { Wheel, rollSegment, targetRotationForSegment, type WheelSegment } from "./Wheel";
import { ClipDot } from "./ClipDot";
import { RewardModal } from "./RewardModal";

type CashIn =
  | { kind: "none" }
  | { kind: "color"; color: ClipColor; count: 2 | 3 }
  | { kind: "gold" };

export function SpinView({ area }: { area: Area }) {
  const { state, dispatch } = useApp();
  const [cashIn, setCashIn] = useState<CashIn>({ kind: "none" });
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<SpinPayload | null>(null);
  const [size, setSize] = useState(360);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    function measure() {
      const w = containerRef.current?.clientWidth ?? 360;
      const next = Math.max(240, Math.min(420, Math.floor(w * 0.92)));
      setSize(next);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const colorCounts = useMemo(() => {
    const c: Record<ClipColor, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
      purple: 0,
      orange: 0,
      gold: 0,
    };
    for (const clip of area.bank) c[clip.color]++;
    return c;
  }, [area.bank]);

  const activeTiers: ("t1" | "t2" | "t3")[] = ["t1"];
  if (cashIn.kind === "color" && cashIn.count >= 2) activeTiers.push("t2");
  if (cashIn.kind === "color" && cashIn.count >= 3) activeTiers.push("t3");
  if (cashIn.kind === "gold") activeTiers.push("t2", "t3");

  const hasActiveDiscount = state.pendingBonusQueue.some(
    (s) => s.areaId === area.id && s.state === "active_discount"
  );
  const hasPendingBonus = state.pendingBonusQueue.some(
    (s) => s.state === "pending_spin"
  );

  const onSpin = () => {
    if (spinning) return;
    if (cashIn.kind === "color" && colorCounts[cashIn.color] < cashIn.count) return;
    if (cashIn.kind === "gold" && colorCounts.gold < 1) return;

    const segment: WheelSegment = rollSegment();
    const target = targetRotationForSegment(segment);
    const startRot = rotation % (Math.PI * 2);
    const finalRot = startRot + target;
    const duration = 3500 + Math.floor(Math.random() * 1000);
    const t0 = performance.now();

    setSpinning(true);

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOut(t);
      const r = startRot + (finalRot - startRot) * eased;
      setRotation(r);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        finishSpin(segment);
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const finishSpin = (rolledSegment: WheelSegment) => {
    setSpinning(false);

    const dispatchCashIn =
      cashIn.kind === "color"
        ? { color: cashIn.color, count: cashIn.count }
        : cashIn.kind === "gold"
        ? { gold: true as const }
        : null;

    dispatch({
      type: "spin",
      areaId: area.id,
      cashIn: dispatchCashIn,
      rolledSegment,
    });

    const activeNow: ("t1" | "t2" | "t3")[] = ["t1"];
    if (cashIn.kind === "color" && cashIn.count >= 2) activeNow.push("t2");
    if (cashIn.kind === "color" && cashIn.count >= 3) activeNow.push("t3");
    if (cashIn.kind === "gold") activeNow.push("t2", "t3");

    let paidTier: "t1" | "t2" | "t3" | "jackpot";
    let nearMiss = false;
    switch (rolledSegment) {
      case "t1":
        paidTier = "t1";
        break;
      case "t2":
        if (activeNow.includes("t2")) paidTier = "t2";
        else {
          paidTier = "t1";
          nearMiss = true;
        }
        break;
      case "t3":
        if (activeNow.includes("t3")) paidTier = "t3";
        else {
          paidTier = "t1";
          nearMiss = true;
        }
        break;
      case "jackpot":
        paidTier = "jackpot";
        break;
      case "bonus":
        if (activeNow.includes("t3")) paidTier = "t3";
        else if (activeNow.includes("t2")) paidTier = "t2";
        else paidTier = "t1";
        break;
    }
    const r = area.rewards[paidTier];
    const unit = typeof r.amountUnit === "string" ? r.amountUnit : r.amountUnit.custom;
    const payload: SpinPayload = {
      rolledSegment,
      activeTiers: activeNow,
      paidReward: { tier: paidTier, name: r.name, amount: r.amountNumber, unit },
      cashedIn: dispatchCashIn,
      nearMiss,
    };
    setReward(payload);
    setCashIn({ kind: "none" });
  };

  const closeReward = () => {
    const wasBonus = reward?.rolledSegment === "bonus";
    setReward(null);
    if (wasBonus) {
      dispatch({
        type: "queueBonusSpins",
        areaId: area.id,
        count: 1,
        chainIndexStart: 1,
      });
    }
  };

  const bankEmpty = area.bank.length === 0;
  const disabled = spinning || hasActiveDiscount || hasPendingBonus || bankEmpty;

  return (
    <div className="space-y-4" ref={containerRef}>
      <section className="card p-4">
        <h2 className="font-semibold mb-2">Cash in</h2>
        {bankEmpty ? (
          <p className="text-sm text-slate-500">
            Bank is empty. Complete a habit to earn a clip before spinning.
          </p>
        ) : (
          <div className="space-y-2">
            <RadioRow
              label="No cash-in (T1 only)"
              checked={cashIn.kind === "none"}
              onSelect={() => setCashIn({ kind: "none" })}
            />
            {NON_GOLD_COLORS.map((c) => {
              const n = colorCounts[c];
              if (n < 2) return null;
              return (
                <div key={c} className="flex flex-wrap items-center gap-2">
                  <RadioRow
                    label={
                      <span className="flex items-center gap-2">
                        <ClipDot color={c} />
                        Cash in 2 ({n} avail) → T1+T2
                      </span>
                    }
                    checked={
                      cashIn.kind === "color" &&
                      cashIn.color === c &&
                      cashIn.count === 2
                    }
                    onSelect={() =>
                      setCashIn({ kind: "color", color: c, count: 2 })
                    }
                  />
                  {n >= 3 && (
                    <RadioRow
                      label={
                        <span className="flex items-center gap-2">
                          <ClipDot color={c} />
                          Cash in 3 → T1+T2+T3
                        </span>
                      }
                      checked={
                        cashIn.kind === "color" &&
                        cashIn.color === c &&
                        cashIn.count === 3
                      }
                      onSelect={() =>
                        setCashIn({ kind: "color", color: c, count: 3 })
                      }
                    />
                  )}
                </div>
              );
            })}
            {colorCounts.gold > 0 && (
              <RadioRow
                label={
                  <span className="flex items-center gap-2">
                    <ClipDot color="gold" />
                    Use gold clip → T1+T2+T3 (no color match needed)
                  </span>
                }
                checked={cashIn.kind === "gold"}
                onSelect={() => setCashIn({ kind: "gold" })}
              />
            )}
          </div>
        )}
      </section>

      <div className="card p-4 flex flex-col items-center">
        <Wheel size={size} rotation={rotation} active={activeTiers} />
        <button
          className="btn-primary text-lg mt-4 px-8"
          onClick={onSpin}
          disabled={disabled}
        >
          {spinning ? "Spinning…" : "Spin"}
        </button>
        {hasActiveDiscount && (
          <p className="text-xs text-slate-500 mt-2">
            Resolve the active bonus discount before spinning again.
          </p>
        )}
        {hasPendingBonus && (
          <p className="text-xs text-slate-500 mt-2">
            Resolve the pending bonus wheel before spinning again.
          </p>
        )}
        {bankEmpty && !hasActiveDiscount && !hasPendingBonus && (
          <p className="text-xs text-slate-500 mt-2">
            Earn at least one clip from a habit to spin.
          </p>
        )}
      </div>

      <RewardModal payload={reward} onClose={closeReward} />
    </div>
  );
}

function RadioRow({
  label,
  checked,
  onSelect,
}: {
  label: React.ReactNode;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={[
        "w-full text-left px-3 py-2 rounded-lg border-2 transition flex items-center gap-2",
        checked
          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      ].join(" ")}
      onClick={onSelect}
    >
      <span
        className={[
          "w-4 h-4 rounded-full border-2 flex-shrink-0",
          checked ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600",
        ].join(" ")}
      />
      <span className="text-sm">{label}</span>
    </button>
  );
}
