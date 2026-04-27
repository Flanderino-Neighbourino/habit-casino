import { useState } from "react";
import { HelpCircle, Settings } from "lucide-react";
import { useApp } from "./state/AppContext";
import { Onboarding } from "./components/Onboarding";
import { SettingsModal } from "./components/SettingsModal";
import { AreaTab } from "./components/AreaTab";
import { HistoryTab } from "./components/HistoryTab";
import { areaAccentClasses } from "./lib/util";
import { DiscountBanners } from "./components/DiscountBanners";
import { BonusOverlay } from "./components/BonusOverlay";
import { HelpModal } from "./components/HelpModal";

type TabId = string; // areaId or "history"

export default function App() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabId>(state.areas[0]?.id ?? "history");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!state.onboardingComplete) {
    return <Onboarding />;
  }

  const currentArea = state.areas.find((a) => a.id === tab);

  return (
    <div className="min-h-screen flex flex-col">
      <DiscountBanners />
      <BonusOverlay />

      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-1 overflow-x-auto">
          {state.areas.map((a, i) => {
            const accent = areaAccentClasses(i);
            const active = tab === a.id;
            return (
              <button
                key={a.id}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap",
                  active
                    ? `${accent.bg} text-white`
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                ].join(" ")}
                onClick={() => setTab(a.id)}
              >
                {a.name || `Area ${i + 1}`}
              </button>
            );
          })}
          <button
            className="ml-auto p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setHelpOpen(true)}
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap",
              tab === "history"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-4 pb-24">
        {currentArea ? (
          <AreaTab
            area={currentArea}
            areaIndex={state.areas.findIndex((a) => a.id === currentArea.id)}
          />
        ) : (
          <HistoryTab />
        )}
      </main>

      <button
        className="fixed bottom-4 left-4 z-30 w-12 h-12 rounded-full bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
