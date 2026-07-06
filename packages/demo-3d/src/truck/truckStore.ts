import { createStore } from "zustand/vanilla";

/** Sevkiyat kamyonu durumu: yüklenen paletler + kalkış. Plan tamamlanınca
 * AGV grid'deki paletleri kasaya taşır; hepsi binince kamyon tesisi terk eder. */
export interface TruckStoreState {
  /** Kasaya yüklenmiş palet id'leri (yükleme sırasına göre) */
  loadedIds: number[];
  departing: boolean;
  load: (id: number) => void;
  depart: () => void;
}

export const truckStore = createStore<TruckStoreState>()((set) => ({
  loadedIds: [],
  departing: false,
  load: (id) =>
    set((s) => {
      console.log(`[TRUCK] Palet kasaya yüklendi (${s.loadedIds.length + 1}. palet).`);
      return { loadedIds: [...s.loadedIds, id] };
    }),
  depart: () =>
    set((s) => {
      if (s.departing) return s;
      console.log("[TRUCK] Yükleme tamam — kamyon tesisten ayrılıyor. Sevkiyat yolda!");
      return { departing: true };
    }),
}));
