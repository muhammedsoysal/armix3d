# Cinematic Post Stack (Concept 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the demo-3d post-processing to a cinematic stack — SMAA, subtle chromatic aberration, DoF plumbing for the future Director Mode, fake volumetric light shafts with dust motes, a bloom-visible coil hover glow, and automatic FPS-based quality degradation.

**Architecture:** All composer effects move out of `App.tsx` into a dedicated `PostFX.tsx` driven by the existing `qualityStore` (extended with 3 new flags) plus a tiny new `fxStore` (vanilla zustand, same pattern as `qualityStore`) that Concept 3 (Director Mode) will later flip to enable DoF. Volumetrics are cheap additive-blended cones + drei `<Sparkles>`, not real raymarching. Auto-degrade uses drei `<PerformanceMonitor>` calling a pure `lowerQualityLevel()` helper.

**Tech Stack:** React Three Fiber 8, drei 9, @react-three/postprocessing 2.19 (already installed — **no new runtime packages**), zustand 4 vanilla stores, vitest (new devDep in demo-3d, for the one pure function).

**Already exists — do NOT rebuild:** GPU sparks (`Sparks.tsx`), smoke (`Smoke.tsx`), heat-seam shader (`CuttingGantry.tsx`), Bloom+Vignette, 3-level quality store, laser beam with `toneMapped={false}` (already blooms).

**Working directory for all commands:** `/Users/muhammedsoysal/Metal/metalnest-digital-twin`

---

### Task 1: Quality params extension + pure `lowerQualityLevel` helper (TDD)

**Files:**
- Modify: `packages/demo-3d/src/quality/qualityStore.ts`
- Create: `packages/demo-3d/src/quality/__tests__/qualityStore.test.ts`
- Modify: `packages/demo-3d/package.json` (add vitest devDep + test script)

- [ ] **Step 1: Add vitest to demo-3d**

Run: `npm install -D vitest --workspace=@metalnest/demo-3d`

In `packages/demo-3d/package.json` scripts, add:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test**

Create `packages/demo-3d/src/quality/__tests__/qualityStore.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { lowerQualityLevel } from "../qualityStore";

describe("lowerQualityLevel", () => {
  it("steps ultra down to medium", () => {
    expect(lowerQualityLevel("ultra")).toBe("medium");
  });
  it("steps medium down to low", () => {
    expect(lowerQualityLevel("medium")).toBe("low");
  });
  it("stays at low (floor)", () => {
    expect(lowerQualityLevel("low")).toBe("low");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test --workspace=@metalnest/demo-3d`
Expected: FAIL — `lowerQualityLevel` is not exported.

- [ ] **Step 4: Implement**

In `packages/demo-3d/src/quality/qualityStore.ts`:

a) Extend `QualityParams` (after `envResolution: number;`):

```ts
  /** Sahte volümetrik ışık hüzmeleri + toz partikülleri */
  volumetrics: boolean;
  /** Composer içi kenar yumuşatma */
  smaa: boolean;
  /** Filmsi renk sapması (çok hafif) */
  chromaticAberration: boolean;
```

b) Extend each level in `QUALITY_PARAMS`:

```ts
  // low'a ekle:
    volumetrics: false,
    smaa: false,
    chromaticAberration: false,
  // medium'a ekle:
    volumetrics: true,
    smaa: true,
    chromaticAberration: false,
  // ultra'ya ekle:
    volumetrics: true,
    smaa: true,
    chromaticAberration: true,
```

c) Add the pure helper + a `stepDown` action. **Important:** `stepDown` must NOT persist to localStorage — an auto-degrade on one slow moment must not permanently downgrade the kiosk.

```ts
const LEVEL_ORDER: QualityLevel[] = ["low", "medium", "ultra"];

/** Bir alt kalite seviyesi; 'low' tabandır. Saf fonksiyon — test edilir. */
export function lowerQualityLevel(level: QualityLevel): QualityLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.max(i - 1, 0)];
}
```

In `QualityStoreState` add `stepDown: () => void;` and in the store object add:

```ts
  stepDown: () =>
    set((s) => {
      const next = lowerQualityLevel(s.level);
      if (next === s.level) return s;
      console.log(`[QUALITY] Otomatik düşürme: ${s.level} → ${next}`);
      return { level: next, params: QUALITY_PARAMS[next] };
    }),
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test --workspace=@metalnest/demo-3d`
Expected: 3 tests PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck --workspace=@metalnest/demo-3d`
Expected: no errors.

```bash
git add packages/demo-3d/package.json package-lock.json packages/demo-3d/src/quality
git commit -m "feat(quality): add volumetrics/smaa/CA params and tested auto step-down helper"
```

---

### Task 2: `fxStore` + `PostFX.tsx` — dedicated composer component

**Files:**
- Create: `packages/demo-3d/src/fx/fxStore.ts`
- Create: `packages/demo-3d/src/fx/PostFX.tsx`
- Modify: `packages/demo-3d/src/App.tsx`

- [ ] **Step 1: Create `packages/demo-3d/src/fx/fxStore.ts`**

Same vanilla-store pattern as `qualityStore`. DoF is OFF by default; Concept 3 (Director Mode) will flip it during cinematic shots.

```ts
import { createStore } from "zustand/vanilla";

/** Sinematik efekt durumu — Director Mode (Concept 3) tarafından sürülecek.
 * Kalite ayarından bağımsızdır: kalite "yapabilir mi", fxStore "şu an istiyor mu". */
export interface FxStoreState {
  /** Alan derinliği (bokeh) — yalnızca sinematik kamera akışında açılır */
  dofEnabled: boolean;
  /** Normalize odak uzaklığı (postprocessing DepthOfField focusDistance, 0..1) */
  dofFocusDistance: number;
  setDof: (enabled: boolean, focusDistance?: number) => void;
}

export const fxStore = createStore<FxStoreState>()((set) => ({
  dofEnabled: false,
  dofFocusDistance: 0.02,
  setDof: (enabled, focusDistance) =>
    set((s) => ({
      dofEnabled: enabled,
      dofFocusDistance: focusDistance ?? s.dofFocusDistance,
    })),
}));
```

- [ ] **Step 2: Create `packages/demo-3d/src/fx/PostFX.tsx`**

Note the child order — effects apply in JSX order: SMAA → DoF → Bloom → ChromaticAberration → Vignette. `EffectComposer` in @react-three/postprocessing does not accept `null` children cleanly in all versions, hence the `<></>` fallback pattern already used in `App.tsx`.

```tsx
import { Vector2 } from "three";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";
import { fxStore } from "./fxStore";

const CA_OFFSET = new Vector2(0.0005, 0.0005);

/** Sinematik post-processing yığını. Hangi efektin var olacağını kalite
 * ayarı (yapabilirlik), DoF'un o an açık olmasını fxStore (istek) belirler. */
export function PostFX() {
  const params = useStore(qualityStore, (s) => s.params);
  const dofEnabled = useStore(fxStore, (s) => s.dofEnabled);
  const dofFocusDistance = useStore(fxStore, (s) => s.dofFocusDistance);

  // Low kalite: composer hiç kurulmaz (MSAA yeterli, GPU'ya dokunma)
  if (!params.bloom && !params.smaa) return null;

  return (
    <EffectComposer>
      {params.smaa ? <SMAA /> : <></>}
      {dofEnabled ? (
        <DepthOfField focusDistance={dofFocusDistance} focalLength={0.06} bokehScale={3.5} />
      ) : (
        <></>
      )}
      {params.bloom ? (
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      ) : (
        <></>
      )}
      {params.chromaticAberration ? (
        <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.4} />
      ) : (
        <></>
      )}
      {params.vignette ? <Vignette offset={0.25} darkness={0.65} /> : <></>}
    </EffectComposer>
  );
}
```

- [ ] **Step 3: Swap into `App.tsx`**

Remove the import line `import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";` and add `import { PostFX } from "./fx/PostFX";`. Replace the whole block

```tsx
        {params.bloom && (
          <EffectComposer>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
            {params.vignette ? <Vignette offset={0.25} darkness={0.65} /> : <></>}
          </EffectComposer>
        )}
```

with:

```tsx
        <PostFX />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck --workspace=@metalnest/demo-3d`
Expected: no errors.

- [ ] **Step 5: Visual verification**

Run: `npm run dev --workspace=@metalnest/demo-3d`, open the shown URL.
Check: scene renders identically to before on medium (bloom+vignette still visible during CUTTING); switch quality to ultra via the QualityControls HUD → no console errors; switch to low → composer off, scene still renders.
Temporarily verify DoF plumbing from the browser console: it should blur the background when forced. (Cannot import the store from console; instead temporarily change `dofEnabled: false` to `true` in `fxStore.ts`, observe bokeh blur, then revert to `false`.)

- [ ] **Step 6: Commit**

```bash
git add packages/demo-3d/src/fx packages/demo-3d/src/App.tsx
git commit -m "feat(fx): dedicated PostFX composer with SMAA, chromatic aberration and DoF plumbing"
```

---

### Task 3: Bloom-visible coil hover glow

**Files:**
- Modify: `packages/demo-3d/src/scenes/IndustrialCoilStorage.tsx:29-30`

The hovered coil currently uses `emissiveIntensity 0.2` — far below the bloom `luminanceThreshold 0.9`, so it never glows. Raise it into bloom range with a pulse-free constant (pulse comes with Concept 4's data layer).

- [ ] **Step 1: Edit the hover material**

In `IndustrialCoilStorage.tsx` change:

```tsx
          emissive={hovered ? "#38bdf8" : "#000000"}
          emissiveIntensity={hovered ? 0.2 : 0}
```

to:

```tsx
          emissive={hovered ? "#38bdf8" : "#000000"}
          emissiveIntensity={hovered ? 3.5 : 0}
```

(If the surrounding material also sets `toneMapped`, leave it as-is; `emissiveIntensity 3.5` exceeds the 0.9 threshold after tonemapping via mipmapBlur bloom in practice — verify visually in Step 3 and tune 2.5–5 if needed.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace=@metalnest/demo-3d`
Expected: no errors.

- [ ] **Step 3: Visual verification**

Dev server → hover a rack coil on medium/ultra quality.
Expected: the coil now visibly *glows* (halo bleeding over edges), not just tints blue. The Glassmorphism card still appears. On low quality (no bloom) it degrades gracefully to a bright blue tint.

- [ ] **Step 4: Commit**

```bash
git add packages/demo-3d/src/scenes/IndustrialCoilStorage.tsx
git commit -m "feat(scene): coil hover emissive boosted into bloom range"
```

---

### Task 4: Fake volumetric light shafts + dust motes

**Files:**
- Create: `packages/demo-3d/src/scenes/VolumetricShafts.tsx`
- Modify: `packages/demo-3d/src/scenes/Factory.tsx`

Cheap trick: open-ended cones with a vertical alpha-gradient canvas texture, additive blending, no depth write — plus drei `<Sparkles>` as slow dust motes inside the shafts. No raymarching.

- [ ] **Step 1: Create `packages/demo-3d/src/scenes/VolumetricShafts.tsx`**

```tsx
import { useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, DoubleSide } from "three";
import { Sparkles } from "@react-three/drei";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";

/** Tepeden düşen sahte volümetrik ışık hüzmesi dokusu: üstte parlak,
 * tabana doğru şeffaflaşan dikey gradyan (raymarch yok, kiosk dostu). */
function makeShaftTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.55, "rgba(210,225,255,0.18)");
  grad.addColorStop(1.0, "rgba(200,220,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 128);
  return new CanvasTexture(canvas);
}

// Çatı ışıklıklarının yerleri: hat üstü, rulo deposu üstü, palet sahası üstü
const SHAFTS: { x: number; z: number; topR: number; bottomR: number; h: number }[] = [
  { x: 0, z: 0, topR: 0.5, bottomR: 2.2, h: 9 },
  { x: -6, z: -2, topR: 0.6, bottomR: 2.6, h: 9 },
  { x: 4.2, z: 1, topR: 0.45, bottomR: 2.0, h: 9 },
];

export function VolumetricShafts() {
  const enabled = useStore(qualityStore, (s) => s.params.volumetrics);
  const texture = useMemo(makeShaftTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);

  if (!enabled) return null;

  return (
    <group>
      {SHAFTS.map((s, i) => (
        <group key={i} position={[s.x, s.h / 2, s.z]}>
          <mesh>
            {/* openEnded: uçlarda disk yok, sadece yan yüzey */}
            <coneGeometry args={[s.bottomR, s.h, 24, 1, true]} />
            <meshBasicMaterial
              map={texture}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
              opacity={0.28}
            />
          </mesh>
          {/* Hüzme içinde asılı toz zerreleri */}
          <Sparkles
            count={40}
            scale={[s.bottomR * 1.4, s.h * 0.9, s.bottomR * 1.4]}
            size={1.6}
            speed={0.08}
            opacity={0.35}
            color="#dce8ff"
          />
        </group>
      ))}
    </group>
  );
}
```

Note: `coneGeometry` args are `[radius(bottom), height, radialSegments, heightSegments, openEnded]` — the cone is widest at its base, apex at top, which matches a skylight beam widening toward the floor. `topR` is kept in the data for future per-shaft tuning but the primitive cone always converges to a point; if a truncated look is wanted later, switch to `cylinderGeometry args={[s.topR, s.bottomR, s.h, 24, 1, true]}` — prefer the cylinder form directly if the point-apex looks wrong in Step 3.

- [ ] **Step 2: Mount in `Factory.tsx`**

Add import: `import { VolumetricShafts } from "./VolumetricShafts";`
Add `<VolumetricShafts />` just before the floor `<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>` element.

- [ ] **Step 3: Typecheck + visual verification**

Run: `npm run typecheck --workspace=@metalnest/demo-3d`
Dev server on medium/ultra: three soft light cones from the ceiling over the machine line, coil storage, and pallet area, with slowly drifting dust motes. They must NOT wash out the scene (opacity ~0.28; tune 0.15–0.35). Orbit the camera — additive cones should never produce hard black edges (depthWrite is off). Switch to low quality → shafts disappear.
If the point-apex cone looks artificial, apply the cylinder variant from the note in Step 1.

- [ ] **Step 4: Commit**

```bash
git add packages/demo-3d/src/scenes/VolumetricShafts.tsx packages/demo-3d/src/scenes/Factory.tsx
git commit -m "feat(scene): fake volumetric skylight shafts with dust motes, quality-gated"
```

---

### Task 5: FPS-based quality auto-degrade

**Files:**
- Modify: `packages/demo-3d/src/App.tsx`

- [ ] **Step 1: Wrap scene content in `PerformanceMonitor`**

In `App.tsx`, add to the drei import: `PerformanceMonitor`. Add import `import { qualityStore } from "./quality/qualityStore";` — **already imported** (used for `params`), so only add the callback.

Wrap the Canvas children:

```tsx
      <Canvas
        shadows
        dpr={[1, params.dprMax]}
        camera={{ position: [4.5, 4, 9.5], fov: 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor
          flipflops={2}
          onDecline={() => qualityStore.getState().stepDown()}
        >
          <Factory />
          <MachineLine />
          <SimulationController />
          <OrbitControls
            makeDefault
            target={[-0.8, 1, 0]}
            minDistance={4}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.05}
          />
          <PostFX />
        </PerformanceMonitor>
      </Canvas>
```

`flipflops={2}` stops reacting after 2 up/down oscillations so a borderline machine doesn't thrash. `stepDown()` (Task 1) deliberately skips localStorage, so a one-off slow moment never permanently downgrades the kiosk; the QualityControls HUD still allows manual override back up.

- [ ] **Step 2: Typecheck + visual verification**

Run: `npm run typecheck --workspace=@metalnest/demo-3d`
Dev server: set quality to ultra, then simulate load — in Chrome DevTools → Performance tab → enable "CPU 6x slowdown" for ~15s.
Expected console log: `[QUALITY] Otomatik düşürme: ultra → medium`. The HUD quality selector should reflect the new level. Reload page → level restored from localStorage to the last *manually chosen* level (auto-degrade not persisted).

- [ ] **Step 3: Commit**

```bash
git add packages/demo-3d/src/App.tsx
git commit -m "feat(quality): PerformanceMonitor-driven automatic quality step-down"
```

---

### Task 6: Final verification + build

- [ ] **Step 1: Full test + typecheck + production build**

```bash
npm run test --workspace=@metalnest/demo-3d
npm run typecheck --workspace=@metalnest/demo-3d
npm run build --workspace=@metalnest/demo-3d
```

Expected: tests pass, no type errors, `packages/demo-3d/dist` builds (Vercel path unchanged).

- [ ] **Step 2: Full visual pass (exhibition checklist)**

Dev server, run one full production cycle on each quality level:
1. **ultra:** sparks bloom hot during CUTTING, laser beam glows, seam glows/cools, 3 volumetric shafts + dust, hover coil halos blue, subtle CA at screen edges, vignette.
2. **medium:** same minus chromatic aberration.
3. **low:** no composer, no shafts — still >50fps and readable.
4. DoF flag flip test (temporary `dofEnabled: true`): background blurs, no crash on quality switching while DoF active. Revert.

- [ ] **Step 3: Commit any tuning deltas**

```bash
git add -A packages/demo-3d
git commit -m "chore(fx): final tuning pass for cinematic post stack"
```

---

## Out of scope (explicitly deferred)

- Animating `dofFocusDistance` per camera shot → **Concept 3 (Director Mode)**, which consumes `fxStore.setDof`.
- Emissive pulse animations / holographic materials → **Concept 4**.
- AGV beacons using bloom → **Concept 1**.
