import { createStore } from "zustand/vanilla";

/** Arıza/alarm senaryosu: makine duraksar, andon kırmızı yanar, telemetri
 * ALARM basar, operatör "müdahale eder", OEE düşer → kestirimci bakımın
 * değeri canlı anlatılır. Otomatik çözülür (VARSAYILAN 12 sn). */
export interface AlarmStoreState {
  active: boolean;
  machineId: string;
  note: string;
  /** epoch ms — bu andan sonra otomatik temizlenir */
  until: number;
  trigger: (machineId: string, note: string, durationMs?: number) => void;
  clear: () => void;
}

export const alarmStore = createStore<AlarmStoreState>()((set) => ({
  active: false,
  machineId: "",
  note: "",
  until: 0,
  trigger: (machineId, note, durationMs = 12_000) => {
    console.log(`[ALARM] ${machineId}: ${note}`);
    set({ active: true, machineId, note, until: Date.now() + durationMs });
  },
  clear: () => {
    console.log("[ALARM] Müdahale tamam — üretim devam ediyor");
    set({ active: false });
  },
}));

/** Vinç ikmal turu tetiği (rulo tükenmesi / periyodik stok rotasyonu). */
export const craneStore = createStore<{ replenishing: boolean; start: () => void; done: () => void }>()(
  (set) => ({
    replenishing: false,
    start: () => {
      console.log("[VINC] Rulo ikmal turu başladı — depodan yeni rulo alınıyor");
      set({ replenishing: true });
    },
    done: () => set({ replenishing: false }),
  }),
);
