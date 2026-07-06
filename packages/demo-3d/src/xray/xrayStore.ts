import { createStore } from "zustand/vanilla";

/** X-Ray / Veri Katmanı durumu. Dalga animasyonunun kendisi XRayEffect'te
 * (mutable frame state) yaşar; burada yalnızca hedef durum tutulur. */
export interface XRayStoreState {
  active: boolean;
  toggle: () => void;
}

export const xrayStore = createStore<XRayStoreState>()((set) => ({
  active: false,
  toggle: () =>
    set((s) => {
      console.log(`[XRAY] Veri katmanı ${s.active ? "kapatılıyor" : "açılıyor"}`);
      return { active: !s.active };
    }),
}));
