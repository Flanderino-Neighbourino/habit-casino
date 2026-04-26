import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "../state/AppContext";
import { AreaEditor } from "./AreaEditor";
import { areaAccentClasses } from "../lib/util";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { state, resetAll } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetText, setResetText] = useState("");

  return (
    <Modal open onClose={onClose} title="Settings" size="lg">
      <div className="space-y-3">
        {state.areas.map((a, i) => {
          const accent = areaAccentClasses(i);
          const isOpen = openIdx === i;
          return (
            <div key={a.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <span className={["w-3 h-3 rounded-full", accent.dot].join(" ")} />
                  <span className="font-medium">{a.name || `Area ${i + 1}`}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
                  <AreaEditor area={a} />
                </div>
              )}
            </div>
          );
        })}

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
