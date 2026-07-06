import { createStore } from "zustand/vanilla";

/** Ses tarayıcı kuralı gereği kullanıcı jestiyle açılır (AudioContext). */
export interface AudioStoreState {
  enabled: boolean;
  toggle: () => void;
}

export const audioStore = createStore<AudioStoreState>()((set) => ({
  enabled: false,
  toggle: () =>
    set((s) => {
      console.log(`[AUDIO] Mekânsal ses ${s.enabled ? "kapatıldı" : "açıldı"}`);
      return { enabled: !s.enabled };
    }),
}));
