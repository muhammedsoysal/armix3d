# Nesting Projection + Optimizer Thinking + Priced Scrap Bin (Phase 2.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** Make the Decision Engine's math visible: (A) the chosen nest layout projected onto the 3D sheet — cyan part outlines, kerf lines, red-hatched scrap zones, cells filling green as the gantry passes; (B) an "Optimizer Thinking" HUD that flashes rejected nest candidates before stamping the winner; (D) a physical scrap bin that fills as pieces are cut, with a hover card showing accumulated kg and ₺ value of lost material.

**Architecture:** Pure nesting math in `nesting/nestingMath.ts` (tested): given part dims (mm), visual sheet width (1200mm), piece length and kerf, produce cells, trim, scrap ratio and a candidate list (normal/rotated/single-column variants with scrap %). A canvas-texture painter (`paintNest`) renders the layout; `NestingProjection.tsx` maps it onto an overlay plane above the flat sheet ahead of the cut line, repainting throttled during CUTTING with fill driven by `cuttingHeadZ`. `OptimizerThinkingHUD.tsx` animates candidates on `recIndex` change. `scrapStore` accumulates kg/₺ (density 7900 kg/m³, mock ₺/kg constant); `SimulationController` credits it per cut piece; `ScrapBin.tsx` renders a bin whose fill level rises, with hover card.

**Working dir:** branch `main` (user's chosen flow).

### Task 1: `nestingMath` (tested) + `scrapStore`
- `computeNest(partWmm, partLmm, sheetWmm, pieceLmm, kerfMm)` → `{cols, rows, cells, usedWmm, trimWmm, scrapRatio, rotated}` picking best orientation (matches core `HeuristicScrapEstimator` kerf-grid rule).
- `nestCandidates(...)` → ordered array `[{label, scrapPct, nest, chosen}]` (normal, rotated, tek-sıra variants; winner flagged).
- `scrapStore` `{pieces, scrapKg, scrapValueTL, addCut(nest, pieceLmm, sheetWmm, thicknessMm)}` — kg = area·t·ρ, ₺ = kg·85.
- Vitest: grid counts vs estimator rule, trim math, candidate winner = min scrap, scrapKg accumulation.
- Commit `feat(nesting): tested nest math, candidates and priced scrap accounting`.

### Task 2: `NestingProjection.tsx` — layout on the 3D sheet
- Canvas 512×256 painter: dark transparent bg; cells cyan outlines + subtle fill; kerf gaps; trim strip + leftover red diagonal hatching; cut cells fill green.
- Overlay plane `[pieceLen × sheetWidth]` at `[cutX + pieceLen/2, tableY+0.006]`, additive-ish transparent, `userData.noXray`. Visible FEEDING (fade with progress) + CUTTING; repaint ≤10Hz.
- Commit `feat(nesting): live nest projection on the sheet with green cut-fill`.

### Task 3: `OptimizerThinkingHUD.tsx`
- On plan load / recIndex change: sequence candidates (~450ms each, mini canvas previews + scrap %), then lock winner with green stamp `SEÇİLDİ — fire %X` for 2.2s, fade out. Top-center, glassmorphism.
- Commit `feat(hud): optimizer-thinking candidate flashes with winner stamp`.

### Task 4: `ScrapBin.tsx` + wiring
- Bin at `[0.9, 0, -1.6]`: steel walls, rising fill mesh (level ∝ scrapKg, clamps), few offcut chips on top; hover card: `HURDA KASASI · X kg · ₺Y` (+ "bu vardiya" note).
- `SimulationController`: on piece completion (existing LIFTING side-effect) call `scrapStore.addCut(...)` using current part dims.
- Mount in `MachineLine`. Commit `feat(scene): physical scrap bin accumulating priced material loss`.

### Task 5: E2E verify (headless Chrome)
- Projection visible during FEEDING/CUTTING with green fill progress; optimizer flash on job change; scrap bin hover card ₺ ticking after cuts; X-Ray + projection coexistence; console clean; tests/typecheck/build. Commit tuning.
