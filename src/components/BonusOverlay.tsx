import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal } from "./Modal";
import type { BonusStep } from "../types";
import { MAX_BONUS_CHAIN } from "../types";

type Outcome = "free_clip" | "75_off" | "50_off" | "25_off" | "extra_spin";
const OUTCOMES: Outcome[] = ["free_clip", "75_off", "50_off", "25_off", "extra_spin"];

function rollBonusOutcome(): Outcome {
  return OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
}

export function BonusOverlay() {
  const { state } = useApp();

  const pending: BonusStep | undefined = useMemo(
    () =>
      state.pendingBonusQueue.find((s) => s.state === "pending_spin"),
    [state.pendingBonusQueue]
  );

  if (!pending) return null;
  return <BonusModal key={pending.id} step={pending} />;
}

function BonusModal({ step }: { step: BonusStep }) {
  const { state, dispatch } = useApp();
  const area = state.areas.find((a) => a.id === step.areaId);

  const [phase, setPhase] = useState<"idle" | "spinning" | "result" | "discount_pick">(
    "idle"
  );
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [rotation, setRotation] = useState(0);
  const [pickedHabitId, setPickedHabitId] = useState<string | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  if (!area) {
    dispatch({ type: "removeBonusStep", bonusStepId: step.id });
    return null;
  }

  const chainIndex = step.chainIndex ?? 1;

  const startSpin = () => {
    if (phase !== "idle") return;
    const o = rollBonusOutcome();
    const idx = OUTCOMES.indexOf(o);
    const segAngle = (Math.PI * 2) / OUTCOMES.length;
    const target = idx * segAngle;
    const spins = 4 + Math.floor(Math.random() * 2);
    const finalRot = Math.PI * 2 * spins - target;
    const startRot = rotation % (Math.PI * 2);
    const duration = 2400 + Math.floor(Math.random() * 600);
    const t0 = performance.now();
    setPhase("spinning");

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const step2 = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const r = startRot + (finalRot - startRot) * easeOut(t);
      setRotation(r);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step2);
      } else {
        setOutcome(o);
        setPhase("result");
      }
    };
    animRef.current = requestAnimationFrame(step2);
  };

  const resolve = () => {
    if (!outcome) return;
    if (outcome === "free_clip") {
      dispatch({
        type: "bonusWheelResolve",
        areaId: area.id,
        outcome: "free_clip",
        bonusStepId: step.id,
      });
    } else if (outcome === "extra_spin") {
      const wouldExceed = chainIndex + 2 > MAX_BONUS_CHAIN;
      if (wouldExceed) {
        dispatch({
          type: "bonusWheelResolve",
          areaId: area.id,
          outcome: "free_clip",
          bonusStepId: step.id,
        });
      } else {
        dispatch({ type: "removeBonusStep", bonusStepId: step.id });
        dispatch({
          type: "queueBonusSpins",
          areaId: area.id,
          count: 2,
          chainIndexStart: chainIndex + 1,
        });
      }
    } else {
      setPhase("discount_pick");
    }
  };

  const finalizeDiscount = () => {
    if (!pickedHabitId || !outcome) return;
    const pct =
      outcome === "75_off"
        ? 75
        : outcome === "50_off"
        ? 50
        : outcome === "25_off"
        ? 25
        : 0;
    if (pct === 0) return;
    dispatch({
      type: "bonusWheelResolve",
      areaId: area.id,
      outcome: "discount",
      discountPercent: pct as 25 | 50 | 75,
      habitId: pickedHabitId,
      bonusStepId: step.id,
    });
  };

  return (
    <Modal open closable={false} title={`Bonus round (${chainIndex}/${MAX_BONUS_CHAIN})`} size="md">
      {phase !== "discount_pick" ? (
        <div className="space-y-4">
          <BonusWheel rotation={rotation} highlight={phase === "result" ? outcome : null} />
          {phase === "idle" && (
            <button className="btn-primary w-full" onClick={startSpin}>
              Spin bonus wheel
            </button>
          )}
          {phase === "spinning" && (
            <p className="text-center text-sm text-slate-500">Spinning…</p>
          )}
          {phase === "result" && outcome && (
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold">{outcomeLabel(outcome, chainIndex)}</h3>
              <p className="text-sm text-slate-500">
                {outcomeDescription(outcome, chainIndex)}
              </p>
              <button className="btn-primary w-full" onClick={resolve}>
                Continue
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold">
            Pick a habit for your{" "}
            {outcome === "75_off" ? "75% off" : outcome === "50_off" ? "50% off" : "25% off"}{" "}
            discount
          </h3>
          <p className="text-sm text-slate-500">
            You'll have 10 minutes to do the discounted effort and claim a clip.
          </p>
          <div className="space-y-2">
            {area.habits.map((h) => {
              const pct =
                outcome === "75_off" ? 75 : outcome === "50_off" ? 50 : 25;
              const eff = Math.max(1, Math.ceil(h.effortNumber * (1 - pct / 100)));
              const picked = pickedHabitId === h.id;
              return (
                <button
                  key={h.id}
                  className={[
                    "w-full text-left p-3 rounded-lg border-2 transition",
                    picked
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
                  ].join(" ")}
                  onClick={() => setPickedHabitId(h.id)}
                >
                  <div className="font-medium">{h.name}</div>
                  <div className="text-sm text-slate-500">
                    Do {eff} {h.effortUnit} (was {h.effortNumber})
                  </div>
                </button>
              );
            })}
          </div>
          <button
            className="btn-primary w-full"
            disabled={!pickedHabitId}
            onClick={finalizeDiscount}
          >
            Start 10-minute timer
          </button>
        </div>
      )}
    </Modal>
  );
}

function outcomeLabel(o: Outcome, chainIndex: number): string {
  switch (o) {
    case "free_clip":
      return "Free clip!";
    case "75_off":
      return "75% off";
    case "50_off":
      return "50% off";
    case "25_off":
      return "25% off";
    case "extra_spin":
      if (chainIndex + 2 > MAX_BONUS_CHAIN) return "Free clip! (chain capped)";
      return "Extra spins!";
  }
}

function outcomeDescription(o: Outcome, chainIndex: number): string {
  switch (o) {
    case "free_clip":
      return "A clip lands in your bank.";
    case "75_off":
      return "Do just 25% of a habit's effort to earn a clip.";
    case "50_off":
      return "Do half a habit's effort to earn a clip.";
    case "25_off":
      return "Do 75% of a habit's effort to earn a clip.";
    case "extra_spin":
      if (chainIndex + 2 > MAX_BONUS_CHAIN)
        return "Bonus chain is capped at 5. Degraded to a free clip.";
      return "You get 2 more bonus wheel spins.";
  }
}

function BonusWheel({
  rotation,
  highlight,
}: {
  rotation: number;
  highlight: Outcome | null;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const segCount = OUTCOMES.length;
  const segAngle = 360 / segCount;

  const colors: Record<Outcome, string> = {
    free_clip: "#22c55e",
    "75_off": "#3b82f6",
    "50_off": "#a855f7",
    "25_off": "#f97316",
    extra_spin: "#fbbf24",
  };

  function arc(i: number) {
    const start = i * segAngle - 90 - segAngle / 2;
    const end = start + segAngle;
    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${rotation}rad)` }}
      >
        {OUTCOMES.map((o, i) => (
          <g key={o}>
            <path
              d={arc(i)}
              fill={colors[o]}
              opacity={highlight && highlight !== o ? 0.4 : 1}
              stroke="#0f172a"
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#0f172a"
              transform={`rotate(${i * segAngle} ${cx} ${cy}) translate(0 ${-r * 0.65})`}
            >
              {labelFor(o)}
            </text>
          </g>
        ))}
      </svg>
      <div
        className="absolute"
        style={{
          left: cx - 8,
          top: -2,
          width: 16,
          height: 22,
          background: "#fbbf24",
          clipPath: "polygon(50% 100%, 0 0, 100% 0)",
        }}
      />
    </div>
  );
}

function labelFor(o: Outcome): string {
  switch (o) {
    case "free_clip":
      return "FREE CLIP";
    case "75_off":
      return "75% OFF";
    case "50_off":
      return "50% OFF";
    case "25_off":
      return "25% OFF";
    case "extra_spin":
      return "EXTRA SPIN";
  }
}
