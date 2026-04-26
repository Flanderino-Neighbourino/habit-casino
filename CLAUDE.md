# Habit Casino — project notes

## Dev server port: 3003
Bound to `0.0.0.0` so the dev server is reachable over LAN / Tailscale.

## Stack
React 18 + Vite + TypeScript + Tailwind + vite-plugin-pwa.
No backend. All state lives in `localStorage` under the key `habitCasino`.

## Code organization
- `src/types.ts` — full data model (AppState, Area, Clip, etc.)
- `src/state/` — reducer + localStorage wrapper + provider
- `src/components/` — UI by feature
- `src/lib/` — helpers (random, dates, ids)

## Things to remember
- Daily reset runs on load and on `visibilitychange`. Bank/jar persist; only
  daily check-marks reset.
- Wheel probabilities are fixed: 40/30/20/8/2 (T1/T2/T3/Bonus/Jackpot).
  Don't make these configurable.
- 3% gold clip rate when generating a new clip.
- Bonus chain capped at 5 spins total. Excess "Extra spin" silently degrades to "Free clip".
- History is FIFO-capped at 50 entries.
- Areas are always exactly 3, by position. Accent colors are hardcoded by
  index (1=green/Fitness, 2=blue/Career, 3=purple/Music) regardless of name.
