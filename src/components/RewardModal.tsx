import { Sparkles } from "lucide-react";
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
  const { paidReward, nearMiss, rolledSegment } = payload;
  const isJackpot = paidReward.tier === "jackpot";

  return (
    <Modal open onClose={onClose} size="sm">
      <div className="text-center py-4 space-y-3">
        <div
          className={[
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
            isJackpot
              ? "bg-emerald-500 gold-glow"
              : "bg-amber-500",
          ].join(" ")}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {isJackpot ? "JACKPOT!" : tierLabel(paidReward.tier)}
          {nearMiss && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              · near miss ({rolledSegment.toUpperCase()})
            </span>
          )}
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
