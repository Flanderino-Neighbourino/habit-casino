import type {
  AppState,
  Area,
  BonusStep,
  Clip,
  ClipColor,
  Habit,
  HistoryEntry,
  HistoryEntryType,
  Milestone,
  Reward,
  RewardTier,
  SpinPayload,
} from "../types";
import { MAX_HISTORY } from "../types";
import {
  nowIso,
  pickRandomIndices,
  rollClipColor,
  todayLocalDate,
  uid,
} from "../lib/util";

export type Action =
  | { type: "completeOnboarding" }
  | { type: "renameArea"; areaId: string; name: string }
  | { type: "setHabits"; areaId: string; habits: Habit[] }
  | {
      type: "setReward";
      areaId: string;
      tier: RewardTier;
      reward: Reward;
    }
  | { type: "setMilestones"; areaId: string; milestones: Milestone[] }
  | { type: "checkHabit"; areaId: string; habitId: string }
  | {
      type: "claimDiscountClip";
      bonusStepId: string;
    }
  | {
      type: "spin";
      areaId: string;
      cashIn:
        | { color: ClipColor; count: 1 | 2 | 3 }
        | { gold: true }
        | null;
      rolledSegment: SpinPayload["rolledSegment"];
    }
  | {
      type: "bonusWheelResolve";
      areaId: string;
      outcome: "free_clip" | "extra_spin" | "discount";
      discountPercent?: 25 | 50 | 75 | 100;
      habitId?: string;
      bonusStepId: string;
    }
  | {
      type: "queueBonusSpins";
      areaId: string;
      count: number;
      chainIndexStart: number;
    }
  | { type: "removeBonusStep"; bonusStepId: string }
  | { type: "expireDiscounts" }
  | { type: "claimMilestone"; areaId: string; milestoneIndex: number }
  | { type: "nakedUse"; areaId: string; tier: RewardTier }
  | { type: "dailyResetIfNeeded" }
  | { type: "loadState"; state: AppState };

function updateArea(
  state: AppState,
  areaId: string,
  fn: (a: Area) => Area
): AppState {
  return {
    ...state,
    areas: state.areas.map((a) => (a.id === areaId ? fn(a) : a)),
  };
}

function pushHistory(
  state: AppState,
  entry: Omit<HistoryEntry, "id" | "timestamp">
): AppState {
  const full: HistoryEntry = {
    ...entry,
    id: uid(),
    timestamp: nowIso(),
  };
  const next = [full, ...state.history];
  if (next.length > MAX_HISTORY) next.length = MAX_HISTORY;
  return { ...state, history: next };
}

function makeClip(habitId: string): Clip {
  return {
    id: uid(),
    color: rollClipColor(),
    habitId,
    earnedAt: nowIso(),
  };
}

function rewardOf(area: Area, tier: RewardTier): Reward {
  return area.rewards[tier];
}

function rewardSummary(r: Reward): {
  name: string;
  amount: number;
  unit: string;
} {
  const unit =
    typeof r.amountUnit === "string" ? r.amountUnit : r.amountUnit.custom;
  return { name: r.name, amount: r.amountNumber, unit };
}

function bankPenalty(tier: RewardTier): number {
  return { t1: 1, t2: 2, t3: 3, jackpot: 5 }[tier];
}

function jarPenalty(tier: RewardTier): number {
  return { t1: 2, t2: 4, t3: 6, jackpot: 10 }[tier];
}

function milestonesNewlyHit(area: Area): Milestone[] {
  const count = area.jar.length;
  return area.milestones.filter(
    (m) => count >= m.target && !m.claimed
  );
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "completeOnboarding":
      return { ...state, onboardingComplete: true };

    case "renameArea":
      return updateArea(state, action.areaId, (a) => ({
        ...a,
        name: action.name,
      }));

    case "setHabits":
      return updateArea(state, action.areaId, (a) => ({
        ...a,
        habits: action.habits,
      }));

    case "setReward":
      return updateArea(state, action.areaId, (a) => ({
        ...a,
        rewards: { ...a.rewards, [action.tier]: action.reward },
      }));

    case "setMilestones":
      return updateArea(state, action.areaId, (a) => ({
        ...a,
        milestones: action.milestones,
      }));

    case "checkHabit": {
      const area = state.areas.find((a) => a.id === action.areaId);
      if (!area) return state;
      const habit = area.habits.find((h) => h.id === action.habitId);
      if (!habit) return state;
      const currentCount = area.dailyState.completionCounts[habit.id] ?? 0;
      if (currentCount >= habit.dailyTarget) return state;

      const clips: Clip[] = [];
      for (let i = 0; i < habit.clipYield; i++) {
        clips.push(makeClip(habit.id));
      }
      const goldCount = clips.filter((c) => c.color === "gold").length;
      const newCount = currentCount + 1;

      let next = updateArea(state, action.areaId, (a) => ({
        ...a,
        bank: [...a.bank, ...clips],
        dailyState: {
          ...a.dailyState,
          completionCounts: {
            ...a.dailyState.completionCounts,
            [habit.id]: newCount,
          },
        },
      }));
      next = pushHistory(next, {
        areaId: action.areaId,
        type: "habit_completed",
        payload: {
          habitId: habit.id,
          completionNumber: newCount,
          clipsEarned: clips.length,
          goldCount,
        },
      });
      return next;
    }

    case "claimDiscountClip": {
      const step = state.pendingBonusQueue.find(
        (s) => s.id === action.bonusStepId
      );
      if (!step || step.state !== "active_discount") return state;
      const clip = makeClip(step.habitId ?? "discount");
      let next = updateArea(state, step.areaId, (a) => ({
        ...a,
        bank: [...a.bank, clip],
      }));
      next = {
        ...next,
        pendingBonusQueue: next.pendingBonusQueue.filter(
          (s) => s.id !== action.bonusStepId
        ),
      };
      next = pushHistory(next, {
        areaId: step.areaId,
        type: "bonus_discount",
        payload: {
          outcome: "claimed",
          habitId: step.habitId,
          discountPercent: step.discountPercent,
          clipColor: clip.color,
        },
      });
      return next;
    }

    case "spin": {
      const area = state.areas.find((a) => a.id === action.areaId);
      if (!area) return state;

      let next = state;

      const activeTiers: ("t1" | "t2" | "t3")[] = ["t1"];
      let cashedClipIds: string[] = [];

      if (action.cashIn && "color" in action.cashIn) {
        const ci = action.cashIn;
        const matching = area.bank.filter((c) => c.color === ci.color);
        if (matching.length < ci.count) return state;
        cashedClipIds = matching.slice(0, ci.count).map((c) => c.id);
        if (ci.count >= 2) activeTiers.push("t2");
        if (ci.count >= 3) activeTiers.push("t3");
      } else if (action.cashIn && "gold" in action.cashIn) {
        const gold = area.bank.find((c) => c.color === "gold");
        if (!gold) return state;
        cashedClipIds = [gold.id];
        activeTiers.push("t2", "t3");
      }

      if (cashedClipIds.length > 0) {
        next = updateArea(next, area.id, (a) => {
          const removed = a.bank.filter((c) => cashedClipIds.includes(c.id));
          return {
            ...a,
            bank: a.bank.filter((c) => !cashedClipIds.includes(c.id)),
            jar: [...a.jar, ...removed],
          };
        });
      }

      let paidTier: RewardTier;
      let nearMiss = false;
      switch (action.rolledSegment) {
        case "t1":
          paidTier = "t1";
          break;
        case "t2":
          if (activeTiers.includes("t2")) {
            paidTier = "t2";
          } else {
            paidTier = "t1";
            nearMiss = true;
          }
          break;
        case "t3":
          if (activeTiers.includes("t3")) {
            paidTier = "t3";
          } else {
            paidTier = "t1";
            nearMiss = true;
          }
          break;
        case "jackpot":
          paidTier = "jackpot";
          break;
        case "bonus":
          if (activeTiers.includes("t3")) paidTier = "t3";
          else if (activeTiers.includes("t2")) paidTier = "t2";
          else paidTier = "t1";
          break;
      }

      const updatedArea = next.areas.find((a) => a.id === area.id)!;
      const r = rewardOf(updatedArea, paidTier);
      const paidReward = { tier: paidTier, ...rewardSummary(r) };

      const spinPayload: SpinPayload = {
        rolledSegment: action.rolledSegment,
        activeTiers,
        paidReward,
        cashedIn: action.cashIn,
        nearMiss,
      };

      next = pushHistory(next, {
        areaId: area.id,
        type: "spin",
        payload: spinPayload as unknown as Record<string, unknown>,
      });

      const milestonesHit = milestonesNewlyHit(
        next.areas.find((a) => a.id === area.id)!
      );
      for (const m of milestonesHit) {
        next = pushHistory(next, {
          areaId: area.id,
          type: "milestone_hit",
          payload: { target: m.target, rewardName: m.rewardName },
        });
      }

      return next;
    }

    case "queueBonusSpins": {
      const additions: BonusStep[] = [];
      for (let i = 0; i < action.count; i++) {
        additions.push({
          id: uid(),
          areaId: action.areaId,
          state: "pending_spin",
          chainIndex: action.chainIndexStart + i,
        });
      }
      return {
        ...state,
        pendingBonusQueue: [...state.pendingBonusQueue, ...additions],
      };
    }

    case "bonusWheelResolve": {
      const area = state.areas.find((a) => a.id === action.areaId);
      if (!area) return state;

      let next = {
        ...state,
        pendingBonusQueue: state.pendingBonusQueue.filter(
          (s) => s.id !== action.bonusStepId
        ),
      };

      if (action.outcome === "free_clip") {
        const clip = makeClip("bonus_free_clip");
        next = updateArea(next, area.id, (a) => ({
          ...a,
          bank: [...a.bank, clip],
        }));
        next = pushHistory(next, {
          areaId: area.id,
          type: "bonus_free_clip",
          payload: { clipColor: clip.color },
        });
      } else if (action.outcome === "discount") {
        const habit =
          area.habits.find((h) => h.id === action.habitId) ?? area.habits[0];
        const discount = action.discountPercent ?? 50;
        const effortRequired = Math.max(
          1,
          Math.ceil(habit.effortNumber * (1 - discount / 100))
        );
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const step: BonusStep = {
          id: uid(),
          areaId: area.id,
          state: "active_discount",
          discountPercent: discount,
          habitId: habit.id,
          effortRequired,
          expiresAt,
        };
        next = {
          ...next,
          pendingBonusQueue: [...next.pendingBonusQueue, step],
        };
        next = pushHistory(next, {
          areaId: area.id,
          type: "bonus_discount",
          payload: {
            outcome: "started",
            discountPercent: discount,
            habitId: habit.id,
            effortRequired,
            expiresAt,
          },
        });
      }
      return next;
    }

    case "removeBonusStep":
      return {
        ...state,
        pendingBonusQueue: state.pendingBonusQueue.filter(
          (s) => s.id !== action.bonusStepId
        ),
      };

    case "expireDiscounts": {
      const now = Date.now();
      let next = state;
      const expired: BonusStep[] = state.pendingBonusQueue.filter(
        (s) =>
          s.state === "active_discount" &&
          s.expiresAt &&
          new Date(s.expiresAt).getTime() < now
      );
      if (expired.length === 0) return state;
      next = {
        ...next,
        pendingBonusQueue: next.pendingBonusQueue.filter(
          (s) => !expired.some((e) => e.id === s.id)
        ),
      };
      for (const e of expired) {
        next = pushHistory(next, {
          areaId: e.areaId,
          type: "bonus_discount",
          payload: {
            outcome: "expired",
            habitId: e.habitId,
            discountPercent: e.discountPercent,
          },
        });
      }
      return next;
    }

    case "claimMilestone": {
      return updateArea(state, action.areaId, (a) => {
        const milestones = a.milestones.map((m, i) =>
          i === action.milestoneIndex ? { ...m, claimed: true } : m
        );
        return { ...a, milestones };
      });
    }

    case "nakedUse": {
      const area = state.areas.find((a) => a.id === action.areaId);
      if (!area) return state;
      const bp = bankPenalty(action.tier);
      const jp = jarPenalty(action.tier);
      const removeBank = pickRandomIndices(area.bank.length, bp);
      const removeJar = pickRandomIndices(area.jar.length, jp);
      const bankRemoved = removeBank.length;
      const jarRemoved = removeJar.length;
      let next = updateArea(state, area.id, (a) => ({
        ...a,
        bank: a.bank.filter((_, i) => !removeBank.includes(i)),
        jar: a.jar.filter((_, i) => !removeJar.includes(i)),
      }));
      next = pushHistory(next, {
        areaId: area.id,
        type: "naked_use" as HistoryEntryType,
        payload: { tier: action.tier, bankRemoved, jarRemoved },
      });
      return next;
    }

    case "dailyResetIfNeeded": {
      const today = todayLocalDate();
      let changed = false;
      const areas = state.areas.map((a) => {
        if (a.dailyState.date !== today) {
          changed = true;
          return {
            ...a,
            dailyState: { date: today, completionCounts: {} },
          };
        }
        return a;
      });
      if (!changed) return state;
      return { ...state, areas };
    }

    case "loadState":
      return action.state;
  }
}
