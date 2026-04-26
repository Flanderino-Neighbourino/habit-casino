export type ClipColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "gold";

export const NON_GOLD_COLORS: ClipColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

export type AmountUnit =
  | "minutes"
  | "hours"
  | "episodes"
  | "pieces"
  | "dollars"
  | "pages"
  | "sessions"
  | { custom: string };

export type Habit = {
  id: string;
  name: string;
  effortNumber: number;
  effortUnit: string;
  clipYield: number;
  dailyTarget: number;
};

export type Reward = {
  name: string;
  amountNumber: number;
  amountUnit: AmountUnit;
};

export type Milestone = {
  target: number;
  rewardName: string;
  claimed?: boolean;
};

export type Clip = {
  id: string;
  color: ClipColor;
  habitId: string;
  earnedAt: string;
};

export type RewardTier = "t1" | "t2" | "t3" | "jackpot";

export type Area = {
  id: string;
  name: string;
  habits: Habit[];
  rewards: {
    t1: Reward;
    t2: Reward;
    t3: Reward;
    jackpot: Reward;
  };
  milestones: Milestone[];
  bank: Clip[];
  jar: Clip[];
  dailyState: {
    date: string;
    completionCounts: Record<string, number>;
  };
};

export type SpinPayload = {
  rolledSegment: "t1" | "t2" | "t3" | "bonus" | "jackpot";
  activeTiers: ("t1" | "t2" | "t3")[];
  paidReward: { tier: RewardTier; name: string; amount: number; unit: string };
  cashedIn: { color: ClipColor; count: 2 | 3 } | { gold: true } | null;
  nearMiss: boolean;
};

export type HistoryEntryType =
  | "spin"
  | "bonus_main"
  | "bonus_discount"
  | "bonus_free_clip"
  | "naked_use"
  | "milestone_hit"
  | "habit_completed";

export type HistoryEntry = {
  id: string;
  timestamp: string;
  areaId: string;
  type: HistoryEntryType;
  payload: Record<string, unknown>;
};

export type BonusStep = {
  id: string;
  areaId: string;
  state: "pending_spin" | "active_discount" | "expired";
  discountPercent?: 25 | 50 | 75 | 100;
  habitId?: string;
  effortRequired?: number;
  expiresAt?: string;
  /** Number of bonus wheel spins used in this chain so far (1..5). */
  chainIndex?: number;
};

export type AppState = {
  onboardingComplete: boolean;
  areas: Area[];
  history: HistoryEntry[];
  pendingBonusQueue: BonusStep[];
  schemaVersion: number;
};

export const SCHEMA_VERSION = 2;
export const HABIT_YIELD_MIN = 1;
export const HABIT_YIELD_MAX = 20;
export const HABIT_DAILY_MIN = 1;
export const HABIT_DAILY_MAX = 99;
export const MAX_FLY_ANIMS = 10;
export const MAX_HISTORY = 50;
export const MAX_BONUS_CHAIN = 5;
