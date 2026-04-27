import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "../types";
import { reducer, type Action } from "./reducer";
import { loadFromStorage, saveToStorage, clearStorage } from "./storage";
import { makeInitialState } from "./initial";
import {
  getCloudUpdatedAt,
  getLocalChangedAt,
  isSyncConfigured,
  loadPassphrase,
  pullFromCloud,
  pushToCloud,
  setLocalChangedAt,
} from "../lib/sync";
import { IdleReloadModal } from "../components/IdleReloadModal";

type Ctx = {
  state: AppState;
  dispatch: (a: Action) => void;
  resetAll: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

const PUSH_DEBOUNCE_MS = 3000;
const IDLE_MS = 5 * 60 * 1000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, loadFromStorage);
  const stateRef = useRef(state);
  const firstRun = useRef(true);
  const pushTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const [idleOpen, setIdleOpen] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const flushPush = useCallback(async () => {
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }
    const passphrase = loadPassphrase();
    if (!passphrase || !isSyncConfigured()) return;
    try {
      await pushToCloud(passphrase, stateRef.current);
    } catch (e) {
      console.warn("Auto-push failed:", e);
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (!isSyncConfigured() || !loadPassphrase()) return;
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
    }
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      void flushPush();
    }, PUSH_DEBOUNCE_MS);
  }, [flushPush]);

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);
      if (action.type === "loadState") return;
      setLocalChangedAt(new Date().toISOString());
      schedulePush();
    },
    [schedulePush]
  );

  // First-run housekeeping
  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    rawDispatch({ type: "dailyResetIfNeeded" });
    rawDispatch({ type: "expireDiscounts" });
  }, []);

  // Persist state on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Daily reset + discount expiry on visibility change
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") {
        rawDispatch({ type: "dailyResetIfNeeded" });
        rawDispatch({ type: "expireDiscounts" });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Tick to expire discounts
  useEffect(() => {
    const interval = window.setInterval(() => {
      rawDispatch({ type: "expireDiscounts" });
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  // Auto-sync: pull on mount + on visibility change
  useEffect(() => {
    let cancelled = false;

    const tryAutoSync = async () => {
      const passphrase = loadPassphrase();
      if (!passphrase || !isSyncConfigured()) return;
      try {
        const head = await getCloudUpdatedAt(passphrase);
        if (cancelled) return;

        const localAt = getLocalChangedAt();
        const localT = localAt ? new Date(localAt).getTime() : 0;

        if (!head) {
          // Cloud has nothing yet — bootstrap.
          await pushToCloud(passphrase, stateRef.current);
          return;
        }

        const cloudT = new Date(head.updatedAt).getTime();
        if (cloudT > localT) {
          // Cloud is newer — pull and replace local state.
          const result = await pullFromCloud(passphrase);
          if (cancelled || !result) return;
          rawDispatch({ type: "loadState", state: result.state });
        } else if (localT > cloudT) {
          // Local is newer — push.
          await pushToCloud(passphrase, stateRef.current);
        }
        // If equal: in sync, nothing to do.
      } catch (e) {
        console.warn("Auto-sync failed:", e);
      }
    };

    void tryAutoSync();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void tryAutoSync();
      } else if (pushTimerRef.current !== null) {
        // Tab is going hidden with a pending push — flush best-effort.
        void flushPush();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flushPush]);

  // Idle detection — show reload prompt after 5 min of no interaction.
  useEffect(() => {
    if (idleOpen) return;
    const reset = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          setIdleOpen(true);
        }
      }, IDLE_MS);
    };

    reset();
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [idleOpen]);

  const resetAll = useCallback(() => {
    clearStorage();
    rawDispatch({ type: "loadState", state: makeInitialState() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, resetAll }),
    [state, dispatch, resetAll]
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      <IdleReloadModal
        open={idleOpen}
        onReload={() => window.location.reload()}
        onStay={() => setIdleOpen(false)}
      />
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
