# The Living Floor — AGV Logistics Layer (Concept 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox (`- [ ]`) steps.

**Goal:** A living factory floor: AGV-01 physically carries completed pallets from a staging point to their stock-grid slot along Manhattan-style guide lanes; AGV-02 patrols the facility perimeter; animated dashed guide lines glow on the floor; a parked forklift dresses the rack area; AGVs have futuristic hover cards (mission, battery, load) and bloom-lit beacons.

**Architecture:** Pure, tested path math in `agv/agvLogic.ts` (polyline arc-length walk + heading, drop-slot calc, mission leg builder). `agvStore` (vanilla zustand) holds high-level status only (phase, battery, carryingId, pendingIds) — per-frame motion lives in a mutable `agvFrame` (same pattern as `simFrame`). `AGV.tsx` renders a high-detail procedural robot inside `OptionalModel name="agv"` (drop-in GLB support) and drives missions in `useFrame`. `Pallet.tsx` gets a shared `PalletWithStack` export; completed pallets render at a staging lane until the AGV delivers them to their (now stable) grid slot. `SimulationController` ordering fix: append instead of prepend.

**Tech stack:** Existing only — drei (`RoundedBox`, `Line`, `Html`, `Billboard`), zustand, Tailwind. No new packages. GLB upgrade path via existing `OptionalModel` manifest.

**Working dir:** `/Users/muhammedsoysal/Metal/metalnest-digital-twin`, branch `feat/cinematic-post-stack`.

---

### Task 1: Tested path/mission math + `agvStore` + stable pallet ordering

**Files:** Create `packages/demo-3d/src/agv/agvLogic.ts`, `packages/demo-3d/src/agv/agvStore.ts`, `packages/demo-3d/src/agv/__tests__/agvLogic.test.ts`; Modify `packages/demo-3d/src/sim/SimulationController.tsx` (append ordering).

- [ ] Failing tests: `pathLength`, `pointAlongPath` (position, heading, clamp), `dropSlotFor(idx)` grid math matching Pallet.tsx (col=⌊idx/2⌋, row=idx%2 → x=palletX+1.8+col·1.5, z=0|-1.2), `missionLegs` (home→staging→slot→home waypoint chain).
- [ ] Implement; tests green; typecheck.
- [ ] `SimulationController.tsx`: `completed = [...s.completedPallets, { id: Date.now(), stack }].slice(-6)` — stable slots, fixes grid-shuffle glitch.
- [ ] Commit `feat(agv): tested path math, mission legs and stable pallet grid ordering`

### Task 2: AGV model + mission motion + pallet carrying

**Files:** Create `packages/demo-3d/src/agv/AGV.tsx`; Modify `packages/demo-3d/src/scenes/Pallet.tsx` (export `PalletWithStack`, staging render, hide carried), `packages/demo-3d/src/scenes/MachineLine.tsx` (mount).

- Procedural AGV (in `OptionalModel name="agv"`): RoundedBox chassis, lift deck, 4 wheels, LiDAR dome, emissive light-bar (state-colored: cyan idle / amber transport / green charging), pulsing orange beacon (blooms), additive underglow disc.
- Mission cycle per completed pallet: DOCKED → TO_PICKUP → LIFT (deck +0.12) → TO_DROP → DROP → TO_HOME; Manhattan lanes; yaw turns shortest-arc; battery drains on missions, recharges docked.
- `Pallet.tsx`: completed pallets not yet delivered render at staging lane; carried pallet rides the AGV deck; delivered ones sit in the grid.
- [ ] Typecheck + commit `feat(agv): AGV-01 carries completed pallets from staging to stock grid`

### Task 3: Guide-lane network + patrol AGV + parked forklift

**Files:** Create `packages/demo-3d/src/agv/GuideLanes.tsx`, `packages/demo-3d/src/scenes/Forklift.tsx`; Modify `MachineLine.tsx`.

- Dashed drei `<Line>` polylines along logistics lanes + perimeter loop, animated `dashOffset` (data-flow scroll), cyan; quality-gated is unnecessary (cheap), but hide on `low` with volumetrics flag? No — always on (few hundred verts).
- AGV-02 patrols the perimeter loop endlessly (reuses same component with `patrol` prop).
- Procedural parked forklift (safety-orange, mast, forks, overhead guard, counterweight) near racks in `OptionalModel name="forklift"`.
- [ ] Typecheck + commit `feat(scene): guide-lane network, patrol AGV and parked forklift`

### Task 4: Futuristic AGV hover HUD + E2E verification

**Files:** Modify `packages/demo-3d/src/agv/AGV.tsx` (Html hover card).

- Hover card (same glassmorphism family as coils): `AGV-01 · OTONOM`, mission label, animated battery bar, load (`5 parça · 304 BA`), speed readout. Hover also brightens underglow.
- [ ] Full: tests + typecheck + build.
- [ ] Headless Chrome: screenshot AGV at dock; wait for a pallet completion (~70s sim) → screenshots of pickup/transport (pallet visibly ON the AGV) → delivered to grid; hover card render; patrol AGV moving; console clean.
- [ ] Commit tuning; final commit.

**Deferred:** purchased premium GLBs (drop into `/models/manifest.json`: `"agv": "agv.glb"`, `"forklift": "forklift.glb"` — zero code change), PositionalAudio beeps (needs user-gesture audio unlock decision), Director-Mode AGV chase-cam shot (Concept 4 polish pass).
