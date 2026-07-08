# 🎯 MASTER PROMPT — "Ultra Luxury" Transformation (Paste to new session)

You are the Chief Architect of the "MetalNest Digital Twin" project. The codebase is located in `/Users/muhammedsoysal/Metal/metalnest-digital-twin`. Before doing anything, read the `yapilan_degisiklikler.md` and `docs/` folders. 

Current Status: We have React Three Fiber + Zustand, a Guillotine/1D-CSP/WHCA* Decision Engine (with 46+ unit tests), a live ERP gateway (REST+WS), Director Mode, X-Ray, and AGV/Forklift/Crane logistics. **EVERYTHING IS WORKING AND COMMITTED.** Do not break existing features; build upon them.

**MISSION:** Transform this demo into an "Ultra-Luxury" B2B sales showcase, rivaling Siemens Tecnomatix or NVIDIA Omniverse. Use **Inline Execution**. For every phase, you must perform typechecks, run tests, and do headless-Chrome screenshot verification. Commit each phase separately. **Maintaining 60 FPS (on medium quality) is a strict rule.**

Execute the following phases sequentially:

**PHASE 1 — FACTORY BUILDING:** Currently, the facility floats in empty space. Build an enclosed building: add walls (with window strips), roof trusses + corrugated roof panels, skylights aligned with the existing volumetric light shafts, a real loading dock door for the truck, and floor safety lines/pedestrian walkways (yellow paint decals). Add signs on the walls like "ZONE 1", "SHIPPING", "COIL STORAGE". Make the interior visible (e.g., no front wall or start the camera inside). Pay strict attention to the draw-call budget.

**PHASE 2 — GANTT / PLANNING VIEW:** The heart of any MES. Add a "Plan" icon to the toolbar that opens a full-screen drawer: machines are rows, jobs are colored blocks (NOT draggable, purely visual). The "now" line flows live. Alarm blocks should be red, completed jobs should be faded. Data source: existing plan + telemetryStore + alarmStore. Build this purely with SVG, do NOT add external chart libraries.

**PHASE 3 — UI DESIGN SYSTEM:** Unify all HUDs into a single premium design language. Use a strict typography scale (11/13/16/24), consistent 8px spacing, a single reusable `<Glass>` panel component, an Inter/Geist-like font (with system fallbacks), 150ms ease-out micro-transitions, and tabular-nums for digits. Color Palette: strict neutral dark theme + one accent (cyan) + semantics (green/amber/red). Remove the chaotic purple/violet decorations.

**PHASE 4 — SPLASH & ONBOARDING:** Add a branded splash screen (Logo + "Decision Engine Loading..." synced with actual loading progress). Add a cinematic camera descent into the first frame, and a 3-step soft onboarding tooltips for first-time visits (Toolbar / X-Ray / Click a Pallet).

**PHASE 5 — PREMIUM MODELS:** If the user has purchased any GLBs listed in `docs/PREMIUM_ASSETS.md`, integrate them (manifest transform system is already prepared). If not, finalize Phases 1-4 and wait for the models.

**CRITICAL RULES:** Apply strict TDD/verify discipline. Test pure logic. Prove success with screenshots at every phase. If FPS drops, do a draw-call diet immediately. Keep the UI text in Turkish. NEVER break the existing 46+ tests.
