# X-Ray / Data Layer Toggle (Concept 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** One toggle (button or `X` key) washes the whole facility with an expanding energy sphere that swaps every mesh to a TRON-style holographic material (dark navy + cyan fresnel rim + animated scanlines, bloom-hot); glowing data pipelines arc from the active coil → machine → pallet; live data billboards float over key assets. Toggling back runs the reverse wave.

**Architecture:** `xrayStore` (vanilla zustand) holds `{active}`; wave progress is mutable frame state. `XRayEffect.tsx` (in Canvas) traverses the scene each frame while a wave is running and swaps `mesh.material` to ONE shared holo `ShaderMaterial` when the expanding front (from the camera position at toggle time) passes the mesh — originals kept in a `Map` for exact restore on the reverse wave. Meshes spawned mid-x-ray get swapped by the same per-frame sweep. A translucent additive shell mesh visualizes the wavefront. `revealRadiusAt()` easing is pure + tested. Pipelines/billboards only render while active.

**Tech stack:** existing only (ShaderMaterial, drei `QuadraticBezierLine`/`Line`, `Html`). Points (sparks) and Line2 (lanes) are untouched by the swap (mesh-only filter).

**Working dir:** branch `feat/cinematic-post-stack`.

### Task 1: `xrayStore` + tested wave easing
- Create `packages/demo-3d/src/xray/xrayStore.ts` (`active`, `toggle` — logs), `xray/waveMath.ts` (`revealRadiusAt(t, duration, maxRadius)` — cubic ease-out, clamps, monotonic), test in `xray/__tests__/waveMath.test.ts` (0 at t=0, maxR at t≥duration, monotonic mid).
- Commit `feat(xray): store and tested reveal-wave easing`.

### Task 2: `XRayEffect` — holo material + expanding-sphere material wave
- Create `packages/demo-3d/src/xray/XRayEffect.tsx`: shared holo ShaderMaterial (navy base, cyan fresnel via `cameraPosition`, world-Y scanlines with `uTime`, rim values >1 → blooms; ShaderMaterial skips tonemapping so no flag needed); wave state `{mode: 'in'|'out'|null, t, origin}`; per-frame sweep swaps/restores materials as front passes each mesh's world position; additive shell sphere shows the front; deactivating runs reverse wave then restores all leftovers. Mount in `MachineLine` (or `App` Canvas root).
- Commit `feat(xray): TRON holo material swap with expanding-sphere reveal wave`.

### Task 3: Data pipelines + live billboards + toggle UI + E2E
- Create `xray/DataPipelines.tsx`: animated dashed arcs coil→cutter→pallet (drei `QuadraticBezierLine`, scrolling dashOffset, cyan; bloom-hot color).
- Create `xray/DataBillboards.tsx`: Html labels (mono cyan, glass) — coil (kalan %, malzeme), machine (durum + faz %), palet (doluluk n/5), 500ms poll like `useSimSnapshot`.
- Create `hud/XRayToggle.tsx`: button under Sunum Modu + global `X` key listener; mount in App.
- E2E headless Chrome: toggle on → shell wave screenshot mid-transition → full holo look + pipelines + billboards → toggle off restores normal materials → console clean. Tests+typecheck+build. Final commits.
