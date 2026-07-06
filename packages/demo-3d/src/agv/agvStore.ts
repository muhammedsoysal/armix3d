import { createStore } from "zustand/vanilla";
import type { PalletPiece } from "../sim/simStore";
import { truckStore } from "../truck/truckStore";

/** AGV görev fazları: kenetli → alıma git → kaldır → bırakmaya git → indir → dön */
export type AgvPhase = "DOCKED" | "TO_PICKUP" | "LIFT" | "TO_DROP" | "DROP" | "TO_HOME";

export const AGV_PHASE_LABEL: Record<AgvPhase, string> = {
  DOCKED: "ŞARJDA · GÖREV BEKLİYOR",
  TO_PICKUP: "ALIM NOKTASINA GİDİYOR",
  LIFT: "PALET KALDIRILIYOR",
  TO_DROP: "STOK SAHASINA TAŞIYOR",
  DROP: "PALET İNDİRİLİYOR",
  TO_HOME: "İSTASYONA DÖNÜYOR",
};

export interface PendingPallet {
  id: number;
  stack: PalletPiece[];
  /** completedPallets içindeki kalıcı grid indeksi (stabil — append sıralı) */
  slotIdx: number;
  /** Bantlama istasyonu bitiş zamanı (epoch ms) — AGV bundan önce almaz */
  readyAt: number;
}

/** AGV görev tanımı: store = istasyon→grid, load = grid→kamyon kasası. */
export interface AgvMission {
  kind: "store" | "load";
  pallet: PendingPallet;
}

/** Yüksek seviyeli AGV durumu — HUD ve Pallet.tsx buradan okur.
 * Kare-başı hareket verisi react dışında (AGV.tsx içindeki ref) tutulur. */
export interface AgvStoreState {
  phase: AgvPhase;
  /** 0–100; görevde iner, dock'ta dolar */
  battery: number;
  /** Şu an deck üzerinde taşınan palet (yoksa null) */
  carrying: PendingPallet | null;
  /** İstasyonda AGV bekleyen dolu paletler (FIFO) */
  pending: PendingPallet[];
  /** Grid'e fiilen teslim edilmiş palet id'leri — Pallet.tsx yalnızca bunları çizer */
  deliveredIds: number[];
  /** Aktif görev — alım/bırakma noktalarını AGV.tsx bundan türetir */
  mission: AgvMission | null;
  enqueue: (p: PendingPallet) => void;
  startMission: (mission: AgvMission) => void;
  /** Alım noktasına varıldı: kaldırma animasyonu başlar */
  beginLift: () => void;
  /** LIFT bitti: sıradaki palet deck'e alınır */
  pickUp: () => void;
  beginDrop: () => void;
  /** DROP bitti: palet grid'e teslim edilir */
  deliver: () => void;
  dock: () => void;
  setBattery: (battery: number) => void;
}

export const agvStore = createStore<AgvStoreState>()((set) => ({
  phase: "DOCKED",
  battery: 100,
  carrying: null,
  pending: [],
  deliveredIds: [],
  mission: null,
  enqueue: (p) => set((s) => ({ pending: [...s.pending, p] })),
  startMission: (mission) => set({ phase: "TO_PICKUP", mission }),
  beginLift: () => set({ phase: "LIFT" }),
  pickUp: () =>
    set((s) => {
      const m = s.mission;
      if (!m) return { phase: "TO_HOME" };
      console.log(
        m.kind === "store"
          ? `[AGV] Palet #${m.pallet.slotIdx + 1} alındı, stok sahasına taşınıyor.`
          : `[AGV] Palet #${m.pallet.slotIdx + 1} gridden alındı, kamyona yükleniyor.`,
      );
      return {
        phase: "TO_DROP",
        carrying: m.pallet,
        pending: m.kind === "store" ? s.pending.filter((p) => p.id !== m.pallet.id) : s.pending,
      };
    }),
  beginDrop: () => set({ phase: "DROP" }),
  deliver: () =>
    set((s) => {
      if (!s.carrying || !s.mission) return { phase: "TO_HOME", carrying: null, mission: null };
      if (s.mission.kind === "store") {
        console.log(`[AGV] Palet #${s.carrying.slotIdx + 1} stok sahasına teslim edildi.`);
        return {
          phase: "TO_HOME",
          carrying: null,
          mission: null,
          deliveredIds: [...s.deliveredIds, s.carrying.id],
        };
      }
      truckStore.getState().load(s.carrying.id);
      return { phase: "TO_HOME", carrying: null, mission: null };
    }),
  dock: () => set({ phase: "DOCKED" }),
  setBattery: (battery) => set({ battery }),
}));
