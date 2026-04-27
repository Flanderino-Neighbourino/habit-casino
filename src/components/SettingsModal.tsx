import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "../state/AppContext";
import { AreaEditor } from "./AreaEditor";
import { areaAccentClasses } from "../lib/util";
import { SyncSection } from "./SyncSection";
import { MAX_AREAS, MIN_AREAS } from "../types";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, resetAll } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetText, setResetText] = useState("");

  const removeArea = (areaId: string, areaName: string) => {
    if (state.areas.length <= MIN_AREAS) return;
    if (
      window.confirm(
        `Remove "${areaName}"? All its clips, jar progress, habits, rewards, and milestones for this area will be deleted. History entries will keep referencing the area but show "deleted area".`
      )
    ) {
      dispatch({ type: "removeArea", areaId });
      if (openIdx !== null) setOpenIdx(null);
    }
  };

  return (
    <Modal open onClose={onClose} title="Settings" size="lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Areas</h3>
          <span className="text-xs text-slate-500">
            {state.areas.length} / {MAX_AREAS}
          </span>
        </div>

        {state.areas.map((a, i) => {
          const accent = areaAccentClasses(i);
          const isOpen = openIdx === i;
          return (
            <div key={a.id} className="card overflow-hidden">
              <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <button
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span className={["w-3 h-3 rounded-full", accent.dot].join(" ")} />
                  <span className="font-medium">{a.name || `Area ${i + 1}`}</span>
                </button>
                <button
                  className="btn-ghost p-2 text-slate-500 hover:text-red-600"
                  onClick={() => removeArea(a.id, a.name || `Area ${i + 1}`)}
                  disabled={state.areas.length <= MIN_AREAS}
                  aria-label="Remove area"
                  title={
                    state.areas.length <= MIN_AREAS
                      ? `At least ${MIN_AREAS} area required`
                      : "Remove area"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  className="btn-ghost p-2"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                </button>
              </div>
              {isOpen && (
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
                  <AreaEditor area={a} />
                </div>
              )}
            </div>
          );
        })}

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

        <SyncSection />

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          {!confirmReset ? (
            <button
              className="btn-secondary text-red-600 dark:text-red-400"
              onClick={() => setConfirmReset(true)}
            >
              Reset all data
            </button>
          ) : (
            <div className="card p-4 border-red-300 dark:border-red-800">
              <p className="text-sm mb-2">
                This will delete all clips, history, and settings. Type{" "}
                <strong>RESET</strong> to confirm.
              </p>
              <input
                className="input mb-2"
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder="RESET"
              />
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setConfirmReset(false);
                    setResetText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary bg-red-500 text-white hover:bg-red-400"
                  disabled={resetText !== "RESET"}
                  onClick={() => {
                    resetAll();
                    onClose();
                  }}
                >
                  Reset everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
