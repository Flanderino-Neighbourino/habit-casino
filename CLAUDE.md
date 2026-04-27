# Habit Casino — project notes

## Where it runs

- **Dev:** `npm run dev` on port **3003**, bound to `0.0.0.0` (LAN/Tailscale-reachable)
- **Production:** GitHub Pages at **https://flanderino-neighbourino.github.io/habit-casino/**, redeployed on every push to `main` via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Public repo (free Pages tier).
- **Sync backend:** Cloudflare Worker at `https://habit-casino-sync.flanderino.workers.dev`. Source in [worker/](worker/). Worker URL is set as a GitHub Actions repo variable `VITE_SYNC_URL` and baked into the bundle at build time via `import.meta.env.VITE_SYNC_URL`.

## Stack

React 18 + Vite + TypeScript + Tailwind + `vite-plugin-pwa` + lucide-react. No state management library — single `useReducer` + a context wrapper. All client-side storage is `localStorage`.

## Code organization

- `src/types.ts` — full data model (AppState, Area, Habit, Clip, SpinPayload, etc.) and constants (SCHEMA_VERSION, MIN_AREAS=1, MAX_AREAS=5, MAX_HISTORY=50, MAX_BONUS_CHAIN=5, HABIT_YIELD_MIN/MAX, HABIT_DAILY_MIN/MAX)
- `src/state/`
  - `reducer.ts` — pure reducer, all action types
  - `initial.ts` — fresh AppState; `blankArea()` exported for `addArea` action
  - `storage.ts` — load/save/clear; runs migrations + `normalize()` on load
  - `AppContext.tsx` — provider, wraps dispatch with auto-push, runs auto-pull on mount/focus, idle detection
- `src/lib/`
  - `util.ts` — uid, todayLocalDate, rollClipColor, areaAccentClasses, formatRelative
  - `sync.ts` — passphrase storage, push/pull/getCloudUpdatedAt, localChangedAt + lastSyncedAt timestamps
- `src/components/` — UI by feature (Onboarding, AreaTab, HabitsView, SpinView, JarView, HistoryTab, SettingsModal, SyncSection, HelpModal, IdleReloadModal, BonusOverlay, ErrorBoundary, ClipDot, Bank, Wheel, RewardModal, Modal, AreaEditor, DiscountBanners)

## Data model invariants

- **Schema version: 2.** v1 → v2 migration in `storage.ts` adds `clipYield: 1`, `dailyTarget: 1` to each habit and converts `dailyState.completedHabitIds: string[]` to `completionCounts: Record<string, number>`.
- **Areas: 1–5** (was fixed at 3 in v1). Default new state has 3.
- **Wheel probabilities are fixed: 40/30/20/8/2** (T1/T2/T3/Bonus/Jackpot). Do not make configurable.
- **Gold clip rate: 3% per clip generated** (per-clip, not per-tap — a yield-N habit has ~N×3% chance of producing at least one gold).
- **Daily reset:** runs on app load and on `visibilitychange` to visible. Compares `dailyState.date` to today's local date. Resets `completionCounts` to `{}`. Bank, jar, history, and active bonus discount timers all persist.
- **History cap: 50 entries**, FIFO. Old entries reference `areaId` and may show "deleted area" if the area was removed.
- **Bonus chain cap: 5** total bonus-wheel spins per top-level bonus event. "Extra spin" beyond cap silently degrades to "Free clip".
- **Active bonus discount timers** are absolute (`expiresAt` ISO timestamp). Survive reload. Checked every 5s + on visibility change. Producing a clip via discount does NOT count toward `dailyTarget`.

## Wheel resolution rule (current — post April 2026 change)

When the wheel lands on T2 or T3 without that tier activated by cash-in, it's a **loss** — no reward paid, but cashed clips still went into the jar before the resolution (so they count toward milestones). T1 always pays (always active). Bonus pays the highest activated tier and triggers the bonus round. Jackpot always pays Jackpot.

`SpinPayload.paidReward` is nullable; `loss: boolean` flag indicates a loss.

**Legacy:** v1 used a "near miss" mechanic (T2/T3 inactive lands paid T1 with `nearMiss: true`). HistoryTab still renders these legacy entries gracefully.

## Area accent colors (by index, hardcoded — unaffected by name)

`AREA_ACCENTS = ["green", "blue", "purple", "orange", "pink"]`. JarView duplicates these as hex fills.

## Cash-in rules

- 1 clip (any color) → T1 only
- 2 same-color → T1 + T2
- 3 same-color → T1 + T2 + T3
- 1 gold clip → all tiers (no color match needed)

Every spin requires at least 1 clip. The "no cash-in / T1 free" option from earlier iterations was removed.

## Sync (Cloudflare Worker + KV)

- **API:** `GET /sync/:hash` and `PUT /sync/:hash` where `hash = sha256(passphrase)` hex. The passphrase never leaves the device.
- **Worker:** [worker/worker.js](worker/worker.js). 1MB body cap. CORS open. KV namespace `HABIT_KV` (id is in `worker/wrangler.toml`).
- **Frontend timestamps in localStorage:**
  - `habitCasino.syncPassphrase` — raw passphrase (used to compute hash on each request)
  - `habitCasino.syncLastAt` — last successful sync (UI display)
  - `habitCasino.localChangedAt` — local data's "as-of" timestamp; advanced on every state change, set to `cloud.updatedAt` after a successful push or pull
- **Auto-sync** in `AppContext`:
  - On mount + on `visibilitychange` to visible: GET cloud head, compare `cloud.updatedAt` to `localChangedAt`; if cloud newer → pull; if local newer → push; if equal → no-op
  - On dispatch (except `loadState`): `setLocalChangedAt(now)` + schedule a debounced push 3s later
  - On `visibilitychange` to hidden with a pending push timer: flush immediately (best-effort)
- **Idle reload modal** in `AppContext`: 5 min without `pointerdown` or `keydown` in a visible tab → non-dismissable modal with Reload / Stay buttons. Defense-in-depth against the "stale tab clobbers cloud" edge case.

## Things not to do

- Don't make wheel probabilities configurable.
- Don't add sound, haptics, or notifications.
- Don't sync localStorage data anywhere besides through the worker (no localStorage event listeners across origins, etc.).
- Don't bump schema version unless you also write a migration in `storage.ts` AND the migration is silent (no user prompt).
- Don't touch the worker URL hardcoding/env-var split — it's intentional that dev runs at `/` and prod runs at `/habit-casino/`.

## Repo conventions

- Default branch: `main`. Initial commits are on this branch; old `master` was renamed.
- Workflow triggers on push to `main` only.
- Commits in this project use Co-Authored-By Claude. Plain-English summaries follow significant changes (per the user's global CLAUDE.md).
- Diagnostic puppeteer scripts in `scripts/` (`repro.mjs`, `repro-migration.mjs`, `repro-mobile.mjs`) — not part of the app, not in `package.json` deps. Used for verification when blank-screen / migration bugs come up.

## What changed in this session (April 2026)

- v1 → v2 schema migration (variable clip yield + repeatable habits)
- Variable area count (1–5) with add/remove in onboarding + Settings
- Removed near-miss; introduced explicit loss outcomes
- Made every spin cost at least 1 clip
- Cloudflare Worker + KV sync, manual + auto modes
- "Pull from cloud" panel on the onboarding welcome screen
- ErrorBoundary at the root; defensive `normalize()` on load
- HelpModal + Help button in onboarding header and main app header
- GitHub Pages deploy + base-path config (`/habit-casino/` in prod, `/` in dev)
