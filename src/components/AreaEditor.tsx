import { Plus, Trash2 } from "lucide-react";
import type {
  AmountUnit,
  Area,
  Habit,
  Milestone,
  Reward,
  RewardTier,
} from "../types";
import {
  HABIT_DAILY_MAX,
  HABIT_DAILY_MIN,
  HABIT_YIELD_MAX,
  HABIT_YIELD_MIN,
} from "../types";
import { useApp } from "../state/AppContext";
import { uid } from "../lib/util";

const UNIT_OPTIONS: AmountUnit[] = [
  "minutes",
  "hours",
  "episodes",
  "pieces",
  "dollars",
  "pages",
  "sessions",
];

const TIERS: { tier: RewardTier; label: string }[] = [
  { tier: "t1", label: "T1 reward" },
  { tier: "t2", label: "T2 reward" },
  { tier: "t3", label: "T3 reward" },
  { tier: "jackpot", label: "Jackpot reward" },
];

export function AreaEditor({
  area,
  showAreaName = true,
  showHabitHelp = false,
}: {
  area: Area;
  showAreaName?: boolean;
  showHabitHelp?: boolean;
}) {
  const { dispatch } = useApp();

  return (
    <div className="space-y-6">
      {showAreaName && (
        <div>
          <label className="label">Area name</label>
          <input
            className="input"
            value={area.name}
            onChange={(e) =>
              dispatch({
                type: "renameArea",
                areaId: area.id,
                name: e.target.value,
              })
            }
          />
        </div>
      )}

      <HabitsEditor area={area} showHelp={showHabitHelp} />
      <RewardsEditor area={area} />
      <MilestonesEditor area={area} />
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

function HabitsEditor({ area, showHelp }: { area: Area; showHelp: boolean }) {
  const { dispatch } = useApp();

  const update = (habits: Habit[]) =>
    dispatch({ type: "setHabits", areaId: area.id, habits });

  const setHabit = (i: number, h: Partial<Habit>) =>
    update(area.habits.map((x, idx) => (idx === i ? { ...x, ...h } : x)));

  const addHabit = () => {
    if (area.habits.length >= 10) return;
    update([
      ...area.habits,
      {
        id: uid(),
        name: "",
        effortNumber: 1,
        effortUnit: "",
        clipYield: 1,
        dailyTarget: 1,
      },
    ]);
  };

  const removeHabit = (i: number) => {
    if (area.habits.length <= 1) return;
    update(area.habits.filter((_, idx) => idx !== i));
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Habits</h3>
        <span className="text-xs text-slate-500">
          {area.habits.length}/10
        </span>
      </div>
      {showHelp && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
          Set clip yield higher for harder habits. Set daily target if you want to be
          able to do this habit multiple times a day.
        </p>
      )}
      <div className="space-y-3">
        {area.habits.map((h, i) => (
          <div
            key={h.id}
            className="card p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input flex-1 min-w-[140px]"
                placeholder="Habit name (e.g. Burpees)"
                value={h.name}
                onChange={(e) => setHabit(i, { name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="input w-20"
                value={h.effortNumber}
                onChange={(e) =>
                  setHabit(i, {
                    effortNumber: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
              <input
                className="input w-32"
                placeholder="unit"
                value={h.effortUnit}
                onChange={(e) => setHabit(i, { effortUnit: e.target.value })}
              />
              <button
                className="btn-ghost p-2"
                onClick={() => removeHabit(i)}
                disabled={area.habits.length <= 1}
                aria-label="Remove habit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <span className="text-slate-500">📎 per completion</span>
                <input
                  type="number"
                  min={HABIT_YIELD_MIN}
                  max={HABIT_YIELD_MAX}
                  className="input w-16"
                  value={h.clipYield}
                  onChange={(e) =>
                    setHabit(i, {
                      clipYield: clamp(
                        Number(e.target.value) || HABIT_YIELD_MIN,
                        HABIT_YIELD_MIN,
                        HABIT_YIELD_MAX
                      ),
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-slate-500">Times/day</span>
                <input
                  type="number"
                  min={HABIT_DAILY_MIN}
                  max={HABIT_DAILY_MAX}
                  className="input w-16"
                  value={h.dailyTarget}
                  onChange={(e) =>
                    setHabit(i, {
                      dailyTarget: clamp(
                        Number(e.target.value) || HABIT_DAILY_MIN,
                        HABIT_DAILY_MIN,
                        HABIT_DAILY_MAX
                      ),
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn-secondary mt-3"
        onClick={addHabit}
        disabled={area.habits.length >= 10}
      >
        <Plus className="w-4 h-4" /> Add habit
      </button>
    </section>
  );
}

function RewardsEditor({ area }: { area: Area }) {
  const { dispatch } = useApp();

  const setReward = (tier: RewardTier, r: Reward) =>
    dispatch({ type: "setReward", areaId: area.id, tier, reward: r });

  return (
    <section>
      <h3 className="font-semibold mb-2">Rewards</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
        <strong>Choosing rewards:</strong> Pick things that already trigger
        huge dopamine for you AND that you want to limit (because they cost
        time or money). Once it's a reward, the <strong>naked rule</strong>{" "}
        applies: you can only enjoy it when you've won it here. Using it
        outside the system breaks the casino.
      </p>
      <div className="space-y-3">
        {TIERS.map(({ tier, label }) => (
          <RewardRow
            key={tier}
            label={label}
            value={area.rewards[tier]}
            onChange={(r) => setReward(tier, r)}
          />
        ))}
      </div>
    </section>
  );
}

function RewardRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Reward;
  onChange: (r: Reward) => void;
}) {
  const isCustom = typeof value.amountUnit !== "string";
  const stringUnit = typeof value.amountUnit === "string" ? value.amountUnit : "";
  const customValue = isCustom ? (value.amountUnit as { custom: string }).custom : "";

  return (
    <div className="card p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="Reward (e.g. Netflix)"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        <input
          type="number"
          min={0.5}
          step={0.5}
          className="input w-24"
          value={value.amountNumber}
          onChange={(e) =>
            onChange({
              ...value,
              amountNumber: Math.max(0.5, Number(e.target.value) || 1),
            })
          }
        />
        <select
          className="input w-32"
          value={isCustom ? "__custom__" : stringUnit}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__custom__") {
              onChange({ ...value, amountUnit: { custom: customValue || "" } });
            } else {
              onChange({ ...value, amountUnit: v as AmountUnit });
            }
          }}
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u as string} value={u as string}>
              {u as string}
            </option>
          ))}
          <option value="__custom__">Other...</option>
        </select>
        {isCustom && (
          <input
            className="input w-32"
            placeholder="custom unit"
            value={customValue}
            onChange={(e) =>
              onChange({ ...value, amountUnit: { custom: e.target.value } })
            }
          />
        )}
      </div>
    </div>
  );
}

function MilestonesEditor({ area }: { area: Area }) {
  const { dispatch } = useApp();

  const update = (milestones: Milestone[]) =>
    dispatch({ type: "setMilestones", areaId: area.id, milestones });

  const setM = (i: number, m: Partial<Milestone>) =>
    update(area.milestones.map((x, idx) => (idx === i ? { ...x, ...m } : x)));

  const ascending =
    area.milestones[0].target < area.milestones[1].target &&
    area.milestones[1].target < area.milestones[2].target;

  return (
    <section>
      <h3 className="font-semibold mb-2">Milestones</h3>
      <div className="space-y-2">
        {area.milestones.map((m, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500 w-24">
              Milestone {i + 1}
            </span>
            <input
              type="number"
              min={1}
              className="input w-24"
              value={m.target}
              onChange={(e) =>
                setM(i, { target: Math.max(1, Number(e.target.value) || 1) })
              }
            />
            <span className="text-xs text-slate-500">clips →</span>
            <input
              className="input flex-1 min-w-[160px]"
              placeholder="Reward name (e.g. PlayStation)"
              value={m.rewardName}
              onChange={(e) => setM(i, { rewardName: e.target.value })}
            />
          </div>
        ))}
      </div>
      {!ascending && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
          Milestone targets must increase: M1 &lt; M2 &lt; M3.
        </p>
      )}
    </section>
  );
}
