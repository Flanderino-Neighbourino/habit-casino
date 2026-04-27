import { Frown, Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import type { RewardTier, SpinPayload } from "../types";

export function RewardModal({
  payload,
  onClose,
}: {
  payload: SpinPayload | null;
  onClose: () => void;
}) {
  if (!payload) return null;

  if (payload.loss) {
    return (
      <Modal open onClose={onClose} size="sm">
        <div className="text-center py-4 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-slate-300 dark:bg-slate-700">
            <Frown className="w-8 h-8 text-slate-700 dark:text-slate-200" />
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Loss · landed {payload.rolledSegment.toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold">No reward this time.</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your cashed clips still went into the jar — they're working toward
            your milestones. Cash in more clips next time to activate higher
            tiers.
          </p>
          <button className="btn-secondary mt-4 w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const { paidReward, rolledSegment } = payload;
  if (!paidReward) return null;
  const isJackpot = paidReward.tier === "jackpot";

  return (
    <Modal open onClose={onClose} size="sm">
      <div className="text-center py-4 space-y-3">
        <div
          className={[
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
            isJackpot ? "bg-emerald-500 gold-glow" : "bg-amber-500",
          ].join(" ")}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {isJackpot ? "JACKPOT!" : tierLabel(paidReward.tier)}
        </div>
        <h2 className="text-2xl font-bold">{paidReward.name}</h2>
        <p className="text-lg">
          {paidReward.amount} {paidReward.unit}
        </p>
        {rolledSegment === "bonus" && (
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
            Bonus round next…
          </p>
        )}
        <button className="btn-primary mt-4 w-full" onClick={onClose}>
          Claim it
        </button>
      </div>
    </Modal>
  );
}

function tierLabel(t: RewardTier): string {
  if (t === "jackpot") return "JACKPOT";
  return t.toUpperCase();
}
