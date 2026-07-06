# What-If Scenario Sandbox (Phase 2.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** A manager-facing sandbox: pick a product + rush quantity → the REAL `ProductionPlanBuilder` re-plans with a rush order injected into sales history → a diff panel shows old→new plan (rush SKU's rank, fleet scrap %, job count, estimated ₺ impact) → "Planı Uygula" hot-swaps the live production queue (machine re-plans mid-run), or "Vazgeç" discards.

**Architecture:** `simStore` gains `planInputs` (parts/stock/sales/weights captured at load by `SimulationController`). Pure, tested `whatif/whatIfMath.ts`: `injectRushOrder(sales, part, qty)` (boosts/creates the SKU's SalesRecord — more 30-day units, rising trend) and `diffPlans(oldPlan, newPlan, partsRecord)` (scrap %, ranks, total qty, ₺ estimate via plan mass × scrap delta × ₺85/kg). `WhatIfHUD.tsx`: "Senaryo" toggle button under X-Ray; panel lists catalog products with rush-qty presets; on select runs the real builder (`ProductionPlanBuilder` + `HeuristicScrapEstimator` from `@metalnest/core`); diff view with green/red deltas; Apply = `simStore.setPlan(newPlan, parts)` + persist injected sales into `planInputs` (so successive scenarios stack); Cancel discards.

**Working dir:** `main`.

### Task 1: `planInputs` in simStore + tested `whatIfMath`
- Tests: inject creates a record for unseen SKU / boosts existing (30d units += qty, trend rising); diff reports scrap delta + rank change; END-TO-END: real builder on small fixture — rush SKU's rank improves after injection.
- Commit `feat(whatif): plan inputs capture and tested rush-order injection + plan diff`.

### Task 2: `WhatIfHUD.tsx` + Apply flow
- Toggle button (flask icon, top-right stack under X-Ray). Panel: product list (from `planInputs.parts`), qty presets (20/50/100), diff cards (Fire %, rush job rank, iş sayısı, tahmini ₺ etki), Apply/Cancel. Apply logs `[WHATIF] Plan yeniden düzenlendi`.
- Commit `feat(hud): what-if scenario sandbox with live plan hot-swap`.

### Task 3: E2E verify
- Open panel → pick product+qty → diff renders with sane numbers → Apply → queue HUD shows new order, machine continues → console clean; tests/typecheck/build; commit tuning.
