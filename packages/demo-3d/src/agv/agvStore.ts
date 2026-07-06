import { createStore } from "zustand/vanilla";
import type { PalletPiece } from "../sim/simStore";

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
  enqueue: (p: PendingPallet) => void;
  beginPickup: () => void;
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
  enqueue: (p) => set((s) => ({ pending: [...s.pending, p] })),
  beginPickup: () => set({ phase: "TO_PICKUP" }),
  pickUp: () =>
    set((s) => {
      const [next, ...rest] = s.pending;
      if (!next) return { phase: "TO_HOME" };
      console.log(`[AGV] Palet #${next.slotIdx + 1} alındı, stok sahasına taşınıyor.`);
      return { phase: "TO_DROP", carrying: next, pending: rest };
    }),
  beginDrop: () => set({ phase: "DROP" }),
  deliver: () =>
    set((s) => {
      if (!s.carrying) return { phase: "TO_HOME" };
      console.log(`[AGV] Palet #${s.carrying.slotIdx + 1} stok sahasına teslim edildi.`);
      return {
        phase: "TO_HOME",
        carrying: null,
        deliveredIds: [...s.deliveredIds, s.carrying.id],
      };
    }),
  dock: () => set({ phase: "DOCKED" }),
  setBattery: (battery) => set({ battery }),
}));
