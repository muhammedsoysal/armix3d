import { createStore } from "zustand/vanilla";

/** Minimalist UI kuralı: sağ panellerden aynı anda YALNIZCA BİRİ açık. */
export type PanelId = "whatif" | "dashboard" | "report" | "gantt" | null;

export const uiStore = createStore<{ openPanel: PanelId; toggle: (p: Exclude<PanelId, null>) => void }>()(
  (set) => ({
    openPanel: null,
    toggle: (p) => set((s) => ({ openPanel: s.openPanel === p ? null : p })),
  }),
);
