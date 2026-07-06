import { createStore } from "zustand/vanilla";
import type { ShotId } from "./shots";

/** Director Mode (fuar otopilotu) durumu. Kamera hareketinin kendisi
 * DirectorCamera'dadır; burada yalnızca "açık mı, hangi kadraj" tutulur. */
export interface DirectorStoreState {
  active: boolean;
  /** Aktif kadraj; null → bir sonraki olayda kesilecek */
  shotId: ShotId | null;
  activate: () => void;
  deactivate: () => void;
  setShot: (shotId: ShotId) => void;
}

export const directorStore = createStore<DirectorStoreState>()((set) => ({
  active: false,
  shotId: null,
  activate: () => {
    console.log("[DIRECTOR] Sunum modu açıldı");
    // shotId sıfırlanır ki mevcut duruma göre hemen yeni bir kesme yapılsın
    set({ active: true, shotId: null });
  },
  deactivate: () => {
    console.log("[DIRECTOR] Sunum modu kapandı (kullanıcı müdahalesi)");
    set({ active: false, shotId: null });
  },
  setShot: (shotId) => set({ shotId }),
}));
