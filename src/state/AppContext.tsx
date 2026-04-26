import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { AppState } from "../types";
import { reducer, type Action } from "./reducer";
import { loadFromStorage, saveToStorage, clearStorage } from "./storage";
import { makeInitialState } from "./initial";

type Ctx = {
  state: AppState;
  dispatch: (a: Action) => void;
  resetAll: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      dispatch({ type: "dailyResetIfNeeded" });
      dispatch({ type: "expireDiscounts" });
    }
  }, []);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") {
        dispatch({ type: "dailyResetIfNeeded" });
        dispatch({ type: "expireDiscounts" });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch({ type: "expireDiscounts" });
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const resetAll = useCallback(() => {
    clearStorage();
    dispatch({ type: "loadState", state: makeInitialState() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, resetAll }),
    [state, resetAll]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
