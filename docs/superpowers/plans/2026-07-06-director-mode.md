# Director Mode — Exhibition Autopilot (Concept 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Event-driven cinematic camera system: the camera follows the machine's story (state transitions, pallet completions, plan end) through named shots with smooth drei `CameraControls` transitions; a cinematic lower-third + letterbox overlay plays during Director Mode; any user input interrupts instantly and 60s of inactivity resumes it.

**Architecture:** A vanilla-zustand `directorStore` holds `{active, shotId, lastInteractionAt}`. Pure function `shotForEvent()` (tested) maps sim events → shot IDs; `SHOTS` maps IDs → `{position, target, dof?, label}`. `DirectorCamera.tsx` (inside Canvas) replaces `OrbitControls` with drei `<CameraControls>`: subscribes to `machineStateStore`/`simStore`, calls `setLookAt(..., true)` on events, adds a slow orbital drift per shot, flips `fxStore.setDof` for close-ups, listens for the underlying `controlstart` event to interrupt, and resumes after inactivity. `DirectorHUD.tsx` renders letterbox bars, an animated lower-third, and a toggle button.

**Tech Stack:** drei `CameraControls` (camera-controls lib, already installed), zustand vanilla stores, existing `fxStore` DoF plumbing from Concept 2, Tailwind for HUD. No new packages.

**Working directory:** `/Users/muhammedsoysal/Metal/metalnest-digital-twin` on branch `feat/cinematic-post-stack`.

---

### Task 1: `directorStore` + tested `shotForEvent` shot-selection logic

**Files:**
- Create: `packages/demo-3d/src/director/shots.ts`
- Create: `packages/demo-3d/src/director/directorStore.ts`
- Create: `packages/demo-3d/src/director/__tests__/shots.test.ts`

- [ ] **Step 1: Failing test for `shotForEvent`**

```ts
import { describe, expect, it } from "vitest";
import { shotForEvent } from "../shots";

describe("shotForEvent", () => {
  it("plan completion beats everything", () => {
    expect(shotForEvent("CUTTING", { planCompleted: true, palletJustCompleted: false })).toBe("finale");
  });
  it("pallet completion beats machine state", () => {
    expect(shotForEvent("LIFTING", { planCompleted: false, palletJustCompleted: true })).toBe("palletYard");
  });
  it("maps machine states to shots", () => {
    expect(shotForEvent("IDLE", { planCompleted: false, palletJustCompleted: false })).toBe("rackHero");
    expect(shotForEvent("FEEDING", { planCompleted: false, palletJustCompleted: false })).toBe("coilFeed");
    expect(shotForEvent("CUTTING", { planCompleted: false, palletJustCompleted: false })).toBe("cutCloseUp");
    expect(shotForEvent("LIFTING", { planCompleted: false, palletJustCompleted: false })).toBe("lifterShot");
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

- [ ] **Step 3: Implement `shots.ts`** — `ShotId`, `Shot` interface `{label, position, target, dof?, drift}`, `SHOTS` record with 6 shots (rackHero, coilFeed, cutCloseUp, lifterShot, palletYard, finale) using LAYOUT-derived coordinates, and pure `shotForEvent(state, flags)`.

- [ ] **Step 4: Implement `directorStore.ts`** — `{active, shotId, activate, deactivate, setShot}`; `activate` resets shot to null so the next event re-cuts.

- [ ] **Step 5: Tests pass + typecheck + commit** `feat(director): shot registry and tested event→shot selection`

### Task 2: `DirectorCamera` — CameraControls + event subscriptions + interrupt

**Files:**
- Create: `packages/demo-3d/src/director/DirectorCamera.tsx`
- Modify: `packages/demo-3d/src/App.tsx` (replace OrbitControls import/usage, add DirectorHUD)

Behavior:
- `<CameraControls makeDefault>` with same constraints as old OrbitControls (minDistance 4, maxDistance 20, maxPolarAngle).
- When `director.active` && event fires → `controls.setLookAt(px,py,pz, tx,ty,tz, true)` with `smoothTime≈1.4`; set `fxStore.setDof(shot.dof ?? false, shot.dofDistance)`.
- Subscriptions: `machineStateStore.subscribe` (state change), `simStore.subscribe` (completedPallets.length increase, isPlanCompleted).
- Gentle drift in `useFrame` while active: `controls.azimuthAngle += drift*dt`.
- Interrupt: underlying `controls.addEventListener("controlstart", …)` → `deactivate()` + `fxStore.setDof(false)`.
- Resume: interval checks `performance.now() - lastInteractionAt > 60_000` → `activate()`.
- On activate: immediately cut to the shot for the *current* state (don't wait for next transition).

- [ ] Implement, typecheck, commit: `feat(director): event-driven cinematic camera with instant interrupt and idle resume`

### Task 3: `DirectorHUD` — letterbox + lower-third + toggle

**Files:**
- Create: `packages/demo-3d/src/hud/DirectorHUD.tsx`
- Modify: `packages/demo-3d/src/App.tsx`

- Letterbox: two black bars (top/bottom, ~7vh) that slide in/out with CSS transition when active.
- Lower-third: bottom-center glassmorphism bar — red "● CANLI" pulse, shot label (uppercase tracking-widest), separator, live line: `product · SKU · kesim n/N`; re-animates on shot change (key=shotId).
- Toggle button next to QualityControls: 🎬 "Sunum" — activates/deactivates director mode manually.
- Hide the bottom-left "Aktif İş" panel and queue panel during director mode? **No** — keep queue visible but fade to 40% opacity so the cinematic frame dominates (pointer-events preserved).

- [ ] Implement, typecheck, commit: `feat(hud): cinematic letterbox, lower-third and director toggle`

### Task 4: End-to-end verification (headless Chrome)

- [ ] Tests + typecheck + build all green.
- [ ] Playwright script: enable director mode via toggle → screenshot during FEEDING/CUTTING shots (letterbox + lower-third visible, camera moved off default) → simulate mouse drag on canvas → verify director deactivates (letterbox gone) → verify `console --errors` clean.
- [ ] Commit any tuning.

**Creative extras included (user greenlit creative liberty):** slow per-shot orbital drift ("alive" handheld feel), letterbox bars, LIVE badge, auto-DoF on close-up shot only.
