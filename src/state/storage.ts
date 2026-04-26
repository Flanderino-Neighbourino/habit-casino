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
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const migrated = migrate(parsed);
      if (migrated) return migrated;
      const ok = window.confirm(
        "Habit Casino data was saved by an incompatible version. Wipe and start fresh?"
      );
      if (ok) return makeInitialState();
      return makeInitialState();
    }
    return parsed;
  } catch {
    return makeInitialState();
  }
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
