import { useState } from "react";
import type { Area } from "../types";
import { HabitsView } from "./HabitsView";
import { SpinView } from "./SpinView";
import { JarView } from "./JarView";
import { areaAccentClasses } from "../lib/util";

type Sub = "habits" | "spin" | "jar";

export function AreaTab({ area, areaIndex }: { area: Area; areaIndex: number }) {
  const [sub, setSub] = useState<Sub>("habits");
  const accent = areaAccentClasses(areaIndex);

  return (
    <div>
      <div className="sticky top-12 z-20 mb-4 -mx-3 px-3 py-2 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="card p-1 flex gap-1">
          {(["habits", "spin", "jar"] as Sub[]).map((s) => (
            <button
              key={s}
              className={[
                "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition",
                sub === s
                  ? `${accent.bg} text-white`
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              ].join(" ")}
              onClick={() => setSub(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {sub === "habits" && <HabitsView area={area} />}
      {sub === "spin" && <SpinView area={area} />}
      {sub === "jar" && <JarView area={area} areaIndex={areaIndex} />}
    </div>
  );
}
