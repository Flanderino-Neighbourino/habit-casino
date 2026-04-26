import type { AppState, Area, Habit } from "../types";
import { SCHEMA_VERSION } from "../types";
import { makeInitialState } from "./initial";

const KEY = "habitCasino";

export function loadFromStorage(): AppState {
  if (typeof localStorage === "undefined") return makeInitialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makeInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== "object") return makeInitialState();
    let next: AppState | null = parsed;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      next = migrate(parsed);
      if (!next) {
        const ok = window.confirm(
          "Habit Casino data was saved by an incompatible version. Wipe and start fresh?"
        );
        if (ok) return makeInitialState();
        return makeInitialState();
      }
    }
    return normalize(next);
  } catch {
    return makeInitialState();
  }
}

function normalize(s: AppState): AppState {
  const areas: Area[] = (s.areas ?? []).map((a) => {
    const habits: Habit[] = (a.habits ?? []).map((h) => ({
      id: h.id,
      name: h.name ?? "",
      effortNumber: toPosInt(h.effortNumber, 1),
      effortUnit: h.effortUnit ?? "",
      clipYield: toRangedInt(h.clipYield, 1, 1, 20),
      dailyTarget: toRangedInt(h.dailyTarget, 1, 1, 99),
    }));
    const dailyState = a.dailyState ?? { date: "", completionCounts: {} };
    const completionCounts =
      dailyState.completionCounts && typeof dailyState.completionCounts === "object"
        ? dailyState.completionCounts
        : {};
    return {
      ...a,
      habits,
      dailyState: { date: dailyState.date ?? "", completionCounts },
      bank: Array.isArray(a.bank) ? a.bank : [],
      jar: Array.isArray(a.jar) ? a.jar : [],
    };
  });
  return {
    ...s,
    areas,
    history: Array.isArray(s.history) ? s.history : [],
    pendingBonusQueue: Array.isArray(s.pendingBonusQueue) ? s.pendingBonusQueue : [],
  };
}

function toPosInt(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.floor(v);
}

function toRangedInt(n: unknown, fallback: number, lo: number, hi: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(v)));
}

export function saveToStorage(state: AppState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota or storage unavailable; silently ignore
  }
}

export function clearStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

type V1Habit = {
  id: string;
  name: string;
  effortNumber: number;
  effortUnit: string;
};

type V1Area = Omit<Area, "habits" | "dailyState"> & {
  habits: V1Habit[];
  dailyState: { date: string; completedHabitIds: string[] };
};

type V1State = Omit<AppState, "areas" | "schemaVersion"> & {
  areas: V1Area[];
  schemaVersion: 1;
};

function migrate(state: AppState): AppState | null {
  const v = (state as { schemaVersion?: number }).schemaVersion ?? 0;
  let current: unknown = state;
  if (v === 1) {
    current = migrateV1toV2(current as V1State);
  }
  if ((current as AppState).schemaVersion === SCHEMA_VERSION) {
    return current as AppState;
  }
  return null;
}

function migrateV1toV2(s: V1State): AppState {
  const areas: Area[] = s.areas.map((a) => {
    const habits: Habit[] = a.habits.map((h) => ({
      ...h,
      clipYield: 1,
      dailyTarget: 1,
    }));
    const completionCounts: Record<string, number> = {};
    for (const id of a.dailyState.completedHabitIds) {
      completionCounts[id] = 1;
    }
    return {
      ...a,
      habits,
      dailyState: { date: a.dailyState.date, completionCounts },
    };
  });
  return {
    ...s,
    areas,
    schemaVersion: 2,
  };
}
