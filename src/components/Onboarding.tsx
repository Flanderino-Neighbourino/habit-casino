import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "../state/AppContext";
import { AreaEditor } from "./AreaEditor";

type Step =
  | { kind: "welcome" }
  | { kind: "names" }
  | { kind: "area"; areaIdx: number }
  | { kind: "done" };

export function Onboarding() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState<Step>({ kind: "welcome" });
  const [names, setNames] = useState<string[]>(state.areas.map((a) => a.name));

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
      names.forEach((n, i) =>
        dispatch({ type: "renameArea", areaId: state.areas[i].id, name: n })
      );
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
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-32">
        {step.kind === "welcome" && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Welcome to Habit Casino.</h1>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              You're going to set up three life areas. In each area, you'll
              define habits that earn you paper clips, four real-world
              rewards (T1 → Jackpot) you can spin for, and three jar
              milestones. Once you're done, completing a habit earns a clip,
              cashing in clips activates better tiers on the wheel, and the
              wheel decides what you've actually earned. The rules are
              ruthless on purpose — that's why it works.
            </p>
            <button className="btn-primary text-lg w-full sm:w-auto" onClick={goNext}>
              Let's set it up
            </button>
          </div>
        )}

        {step.kind === "names" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Name your three areas.</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Defaults are filled in. Edit if you want.
            </p>
            <div className="space-y-3">
              {names.map((n, i) => (
                <div key={i}>
                  <label className="label">Area {i + 1}</label>
                  <input
                    className="input"
                    value={n}
                    onChange={(e) => {
                      const copy = [...names];
                      copy[i] = e.target.value;
                      setNames(copy);
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="btn-primary w-full sm:w-auto"
              onClick={goNext}
              disabled={names.some((n) => !n.trim())}
            >
              Next
            </button>
          </div>
        )}

        {step.kind === "area" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">
              Configure {state.areas[step.areaIdx].name || `Area ${step.areaIdx + 1}`}
            </h1>
            <AreaEditor area={state.areas[step.areaIdx]} showAreaName={false} />
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

function NextButton({
  area,
  onNext,
}: {
  area: import("../types").Area;
  onNext: () => void;
}) {
  const habitsValid = area.habits.every(
    (h) => h.name.trim() && h.effortNumber >= 1 && h.effortUnit.trim()
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
