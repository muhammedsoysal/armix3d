# Order-to-Ship Finale (Phase 2.4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** Complete the narrative arc: (1) a cinematic Director shot for the slitting line (IDLE now alternates rack-hero ↔ slitting close-up); (2) a banding station at the pallet staging point — completed pallets get straps, corner protectors and a QR label while the AGV waits out the banding delay, and stay visibly banded ever after; (3) a truck dock: after the plan completes, the AGV fetches every stored pallet from the grid and loads it onto a waiting truck, which then departs the facility — filmed by a new Director dock shot.

**Architecture:** `shots.ts` gains `slittingLine` + `truckDock`; `shotForEvent` gets an `idleAlt` flag (tested). `PalletWithStack` gains a `banded` prop (straps/corners/QR as cheap boxes). `BandingStation.tsx` animates an applicator arm at STAGING while `pending[0]` is within its `readyAt` window; `PendingPallet` gains `readyAt` and AGV won't start a store-mission early. `truckStore` (`loadedIds`, `departing`); `agvStore` generalized to missions `{kind: 'store'|'load', pallet}` — load missions pick from grid slots and deliver to the truck; when everything is loaded the truck departs. `Truck.tsx` renders the truck + loaded pallets on its bed (they ride along on departure). `DirectorCamera` subscribes to truckStore for the dock cut.

**Working dir:** `main`.

### Task 1: Director — slitting + dock shots, IDLE alternation (tested)
### Task 2: Banding — `banded` pallets, station arm, AGV banding delay
### Task 3: Truck dock — truckStore, AGV load missions, Truck component, departure + Director hook
### Task 4: E2E — full plan run to completion in headless Chrome: banding visible, loading missions run, truck departs, Director films it; tests/typecheck/build green
