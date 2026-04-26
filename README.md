# Habit Casino

A habit tracker that rewards completed habits using slot-machine psychology:
paper clips, a spinning wheel with tiered rewards, near-misses, jars that fill
toward milestone rewards, and a bonus round.

Single-page web app, fully offline, installable as a PWA. No backend, no
accounts, no sync — all state in `localStorage`.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (dark mode via `prefers-color-scheme`)
- `vite-plugin-pwa` for install / offline
- Lucide icons

## Run

```bash
npm install
npm run dev      # http://localhost:3003 (also bound to 0.0.0.0 for LAN/Tailscale)
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build on port 3003
```

## Concept

Three life areas (default: Fitness, Career, Music). Completing a habit gives
you a colored paper clip. Cash 2 same-color clips into a tier-2 spin, 3 into
a tier-3 spin. Spin the wheel for a real-world reward (you pick what those
rewards are). Cashed clips drop into a jar that fills toward 3 user-defined
milestones. Don't use a reward "naked" — without earning it — or pay a clip
penalty.

See `CLAUDE.md` for project notes (port assignment, etc).
