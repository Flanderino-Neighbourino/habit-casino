import { useState } from "react";
import { ChevronLeft, Cloud, HelpCircle, Plus, Trash2 } from "lucide-react";
import { useApp } from "../state/AppContext";
import { AreaEditor } from "./AreaEditor";
import { HelpModal } from "./HelpModal";
import {
  isSyncConfigured,
  pullFromCloud,
  savePassphrase,
} from "../lib/sync";
import { MAX_AREAS, MIN_AREAS } from "../types";

type Step =
  | { kind: "welcome" }
  | { kind: "names" }
  | { kind: "area"; areaIdx: number }
  | { kind: "done" };

export function Onboarding() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState<Step>({ kind: "welcome" });
  const [helpOpen, setHelpOpen] = useState(false);

  const totalSteps = 2 + state.areas.length + 1;
  const stepIndex = (() => {
    if (step.kind === "welcome") return 1;
    if (step.kind === "names") return 2;
    if (step.kind === "area") return 3 + step.areaIdx;
    return totalSteps;
  })();

  const goNext = () => {
    if (step.kind === "welcome") setStep({ kind: "names" });
    else if (step.kind === "names") {
      setStep({ kind: "area", areaIdx: 0 });
    } else if (step.kind === "area") {
      const next = step.areaIdx + 1;
      if (next < state.areas.length) setStep({ kind: "area", areaIdx: next });
      else setStep({ kind: "done" });
    } else if (step.kind === "done") {
      dispatch({ type: "completeOnboarding" });
    }
  };

  const goBack = () => {
    if (step.kind === "names") setStep({ kind: "welcome" });
    else if (step.kind === "area") {
      if (step.areaIdx === 0) setStep({ kind: "names" });
      else setStep({ kind: "area", areaIdx: step.areaIdx - 1 });
    } else if (step.kind === "done") {
      setStep({ kind: "area", areaIdx: state.areas.length - 1 });
    }
  };

  const canBack = step.kind !== "welcome";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        {canBack ? (
          <button className="btn-ghost p-2" onClick={goBack} aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <div className="flex-1">
          <div className="text-xs text-slate-500">
            Step {stepIndex} of {totalSteps}
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <button
          className="btn-ghost p-2"
          onClick={() => setHelpOpen(true)}
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-32">
        {step.kind === "welcome" && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Welcome to the Habit Tracker Casino!</h1>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Ready to make adapting new habits as easy as sitting at a slot
              machine?
            </p>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
              You probably have things you want to do more of, like workouts,
              reading, practicing something, and things you already love but
              want to limit, like Netflix, takeout, or gaming. Habit Casino
              glues them together. The good things become the only way to earn
              the fun things. Doing your habit drops a paper clip in your bank;
              cashing in clips lets you spin the wheel for real-world rewards
              you've picked. The wheel decides whether you actually win
              (variable rewards, near-jackpots, the works) and the rules are
              tight on purpose. That's the trick: the dopamine that normally
              pulls you toward the couch starts pulling you toward the gym.
            </p>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
              Setup takes about a few minutes. Pick 1–5 areas of your life, a
              few habits in each, and the rewards you'll be spinning for. The
              rest is up to you and the wheel. Enjoy!
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary text-lg" onClick={goNext}>
                Let's set it up
              </button>
              <button
                className="btn-secondary text-lg"
                onClick={() => setHelpOpen(true)}
              >
                <HelpCircle className="w-5 h-5" /> How it works
              </button>
            </div>
            <p className="text-sm text-slate-500">
              The full guide explains the wheel odds, bonus round, the naked
              rule, sync, and tips for picking good rewards. You can open it
              again any time from the <HelpCircle className="inline w-4 h-4 align-text-bottom" /> button in the header.
            </p>

            {isSyncConfigured() && <PullFromCloudPanel />}
          </div>
        )}

        {step.kind === "names" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Set up your areas.</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Pick between {MIN_AREAS} and {MAX_AREAS} areas. Defaults are filled
              in — rename or add/remove as you like.
            </p>
            <div className="space-y-2">
              {state.areas.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16 shrink-0">
                    Area {i + 1}
                  </span>
                  <input
                    className="input flex-1"
                    value={a.name}
                    onChange={(e) =>
                      dispatch({
                        type: "renameArea",
                        areaId: a.id,
                        name: e.target.value,
                      })
                    }
                  />
                  <button
                    className="btn-ghost p-2"
                    onClick={() => {
                      if (state.areas.length <= MIN_AREAS) return;
                      if (
                        window.confirm(
                          `Remove "${a.name || `Area ${i + 1}`}"? You can re-add later but you'll have to set up its habits and rewards from scratch.`
                        )
                      ) {
                        dispatch({ type: "removeArea", areaId: a.id });
                      }
                    }}
                    disabled={state.areas.length <= MIN_AREAS}
                    aria-label="Remove area"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-secondary"
              onClick={() =>
                dispatch({
                  type: "addArea",
                  name: `Area ${state.areas.length + 1}`,
                })
              }
              disabled={state.areas.length >= MAX_AREAS}
            >
              <Plus className="w-4 h-4" /> Add area
            </button>
            <div className="pt-2">
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={goNext}
                disabled={state.areas.some((a) => !a.name.trim())}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step.kind === "area" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">
              Configure {state.areas[step.areaIdx].name || `Area ${step.areaIdx + 1}`}
            </h1>
            <AreaEditor
              area={state.areas[step.areaIdx]}
              showAreaName={false}
              showHabitHelp
            />
            <NextButton area={state.areas[step.areaIdx]} onNext={goNext} />
          </div>
        )}

        {step.kind === "done" && (
          <div className="space-y-4 text-center pt-12">
            <div className="text-6xl">🎰</div>
            <h1 className="text-3xl font-bold">You're ready.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Go earn your first clip.
            </p>
            <button className="btn-primary text-lg" onClick={goNext}>
              Open the casino
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function PullFromCloudPanel() {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPull = async () => {
    if (!passphrase.trim()) {
      setError("Enter the passphrase you used on your other device.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await pullFromCloud(passphrase);
      if (!result) {
        setError(
          "No cloud save found for this passphrase. Push from your other device first, or set up fresh here."
        );
        return;
      }
      savePassphrase(passphrase);
      dispatch({ type: "loadState", state: result.state });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4 mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium">Already use this on another device?</span>
      </div>
      {!open ? (
        <button className="btn-secondary" onClick={() => setOpen(true)}>
          Pull from cloud
        </button>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Enter the same passphrase you used on your other device. Your
            data will load and you'll skip setup.
          </p>
          <input
            type="password"
            className="input"
            placeholder="Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && onPull()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              onClick={onPull}
              disabled={busy}
            >
              {busy ? "Pulling…" : "Pull and continue"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </>
      )}
    </div>
  );
}

function NextButton({
  area,
  onNext,
}: {
  area: import("../types").Area;
  onNext: () => void;
}) {
  const habitsValid = area.habits.every(
    (h) =>
      h.name.trim() &&
      h.effortNumber >= 1 &&
      h.effortUnit.trim() &&
      Number.isInteger(h.clipYield) &&
      h.clipYield >= 1 &&
      h.clipYield <= 20 &&
      Number.isInteger(h.dailyTarget) &&
      h.dailyTarget >= 1 &&
      h.dailyTarget <= 99
  );
  const rewardsValid = (["t1", "t2", "t3", "jackpot"] as const).every(
    (t) => area.rewards[t].name.trim() && area.rewards[t].amountNumber > 0
  );
  const milestonesValid =
    area.milestones.every((m) => m.target >= 1 && m.rewardName.trim()) &&
    area.milestones[0].target < area.milestones[1].target &&
    area.milestones[1].target < area.milestones[2].target;

  const ok = habitsValid && rewardsValid && milestonesValid;

  return (
    <div className="space-y-2">
      {!ok && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Fill in all habits, rewards, and milestones (with strictly
          ascending targets) to continue.
        </p>
      )}
      <button className="btn-primary w-full sm:w-auto" disabled={!ok} onClick={onNext}>
        Next
      </button>
    </div>
  );
}
