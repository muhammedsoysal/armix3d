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
