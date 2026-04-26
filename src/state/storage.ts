import type { AppState } from "../types";
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

function migrate(_state: AppState): AppState | null {
  return null;
}
