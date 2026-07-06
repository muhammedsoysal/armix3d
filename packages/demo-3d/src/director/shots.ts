import type { MachineState } from "@metalnest/core";

export type ShotId =
  | "rackHero"
  | "coilFeed"
  | "cutCloseUp"
  | "lifterShot"
  | "palletYard"
  | "finale";

export interface Shot {
  /** Alt-üçüncü bantta gösterilen sahne adı */
  label: string;
  /** Kamera konumu */
  position: [number, number, number];
  /** Bakış hedefi */
  target: [number, number, number];
  /** Bu planda alan derinliği (bokeh) açılsın mı */
  dof?: boolean;
  /** DoF odak uzaklığı (normalize, PostFX DepthOfField) */
  dofDistance?: number;
  /** Plan içinde yavaş yörünge kayması (rad/sn) — "canlı el kamerası" hissi */
  drift: number;
}

/** Sahne kadrajları. Koordinatlar LAYOUT'a göre elle seçilmiştir:
 * rulo deposu x≈-6 z≈-2, doğrultucu x≈-3.6, kesim x=0, palet x≈4.2. */
export const SHOTS: Record<ShotId, Shot> = {
  rackHero: {
    label: "Rulo Deposu — Çelik Raf Sistemi",
    // Yükseltilmiş + geri çekilmiş: alçak kadraj geçişlerde rulolara
    // sürtünüyordu (clipping); drift yayı artık dar ama emniyet payı da arttı
    position: [-10.2, 2.6, 5.4],
    target: [-6, 1.6, -1.6],
    drift: 0.02,
  },
  coilFeed: {
    label: "Hat 1 — Rulo Açma & Doğrultma",
    position: [-8.4, 2.6, 5.8],
    target: [-4.6, 1.1, 0],
    drift: 0.018,
  },
  cutCloseUp: {
    label: "CNC Kesim — Yakın Plan",
    position: [2.1, 1.5, 2.4],
    target: [0, 0.92, 0],
    dof: true,
    dofDistance: 0.03,
    drift: 0.03,
  },
  lifterShot: {
    label: "Vakum Kaldırıcı — Parça Transferi",
    position: [6.8, 2.8, 4.4],
    target: [2.8, 1.1, 0],
    drift: 0.02,
  },
  palletYard: {
    label: "Sevkiyat Sahası — Palet Stoklama",
    position: [8.5, 5.2, 6.5],
    target: [4.2, 0.4, -1],
    drift: 0.015,
  },
  finale: {
    label: "Tesis Genel Görünüm — Üretim Tamamlandı",
    position: [10.5, 7, 12],
    target: [0, 1, 0],
    drift: 0.012,
  },
};

export interface ShotEventFlags {
  planCompleted: boolean;
  palletJustCompleted: boolean;
}

/** Olay → kadraj seçimi. Öncelik: plan sonu > palet tamamlama > makine fazı.
 * Saf fonksiyon — test edilir. */
export function shotForEvent(state: MachineState, flags: ShotEventFlags): ShotId {
  if (flags.planCompleted) return "finale";
  if (flags.palletJustCompleted) return "palletYard";
  switch (state) {
    case "FEEDING":
      return "coilFeed";
    case "CUTTING":
      return "cutCloseUp";
    case "LIFTING":
      return "lifterShot";
    case "IDLE":
    default:
      return "rackHero";
  }
}
