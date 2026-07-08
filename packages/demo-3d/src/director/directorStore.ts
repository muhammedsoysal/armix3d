import { createStore } from "zustand/vanilla";
import type { ShotId } from "./shots";

/** Director Mode (fuar otopilotu) durumu. Kamera hareketinin kendisi
 * DirectorCamera'dadır; burada "açık mı, hangi kadraj/tur sahnesi" tutulur.
 *
 * İki katman: shotId=null iken FPV DRON TURU uçar (dronePath spline'ı);
 * yüksek öncelikli olaylar (palet, kamyon, final) shotId ile araya girer,
 * süresi dolunca clearShot() turu kaldığı yerden sürdürür. */
export interface DirectorStoreState {
  active: boolean;
  /** Aktif olay kadrajı; null → dron turu uçuyor */
  shotId: ShotId | null;
  /** Dron turunun aktif sahnesi (alt bant + sahne sayacı) */
  tourLabel: string | null;
  tourSeg: number;
  tourSegCount: number;
  activate: () => void;
  deactivate: () => void;
  setShot: (shotId: ShotId) => void;
  /** Olay kadrajından dron turuna geri dön */
  clearShot: () => void;
  setTourSegment: (label: string, seg: number, count: number) => void;
}

export const directorStore = createStore<DirectorStoreState>()((set) => ({
  active: false,
  shotId: null,
  tourLabel: null,
  tourSeg: 0,
  tourSegCount: 0,
  activate: () => {
    console.log("[DIRECTOR] Sunum modu açıldı — dron turu başlıyor");
    set({ active: true, shotId: null });
  },
  deactivate: () => {
    console.log("[DIRECTOR] Sunum modu kapandı (kullanıcı müdahalesi)");
    set({ active: false, shotId: null, tourLabel: null });
  },
  setShot: (shotId) => set({ shotId }),
  clearShot: () => set({ shotId: null }),
  setTourSegment: (tourLabel, tourSeg, tourSegCount) => set({ tourLabel, tourSeg, tourSegCount }),
}));
