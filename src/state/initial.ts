import type { Area, AppState } from "../types";
import { SCHEMA_VERSION } from "../types";
import { todayLocalDate, uid } from "../lib/util";

const DEFAULT_AREA_NAMES = ["Fitness", "Career", "Music"] as const;

function blankArea(name: string): Area {
  return {
    id: uid(),
    name,
    habits: [
      {
        id: uid(),
        name: "",
        effortNumber: 1,
        effortUnit: "",
        clipYield: 1,
        dailyTarget: 1,
      },
    ],
    rewards: {
      t1: { name: "", amountNumber: 1, amountUnit: "minutes" },
      t2: { name: "", amountNumber: 1, amountUnit: "minutes" },
      t3: { name: "", amountNumber: 1, amountUnit: "minutes" },
      jackpot: { name: "", amountNumber: 1, amountUnit: "minutes" },
    },
    milestones: [
      { target: 25, rewardName: "" },
      { target: 75, rewardName: "" },
      { target: 200, rewardName: "" },
    ],
    bank: [],
    jar: [],
    dailyState: {
      date: todayLocalDate(),
      completionCounts: {},
    },
  };
}

export function makeInitialState(): AppState {
  return {
    onboardingComplete: false,
    areas: DEFAULT_AREA_NAMES.map(blankArea),
    history: [],
    pendingBonusQueue: [],
    schemaVersion: SCHEMA_VERSION,
  };
}
