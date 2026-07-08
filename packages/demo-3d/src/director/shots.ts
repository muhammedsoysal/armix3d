import type { MachineState } from "@metalnest/core";

export type ShotId =
  | "rackHero"
  | "coilFeed"
  | "cutCloseUp"
  | "lifterShot"
  | "palletYard"
  | "slittingLine"
  | "grandTour"
  | "truckDock"
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
    position: [-10.2, 2.8, 6.2],
    target: [-6.4, 1.1, 0],
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
  slittingLine: {
    label: "Yarma Hattı — Dilme Bıçakları",
    // Bıçak yelpazesi + şeritlerin ayrılışına dinamik yakın plan
    position: [-3.4, 1.9, 6.3],
    target: [-5.3, 1.05, 3.5],
    dof: true,
    dofDistance: 0.035,
    drift: 0.028,
  },
  grandTour: {
    label: "Tesis Turu — Kuş Bakışı",
    // Katedral ölçeği gösteren süpürme: yüksek ve geniş
    position: [34, 21, 36],
    target: [-2, 1, -4],
    drift: 0.02,
  },
  truckDock: {
    label: "Sevkiyat — Yükleme Rampası",
    position: [10.6, 3.0, 6.4],
    target: [15.2, 1.0, -0.4],
    drift: 0.016,
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
  /** IDLE kadraj çeşitlemesi: true → yarma hattı, false/yok → raf kahramanı */
  idleAlt?: boolean;
  /** 3'lü IDLE rotasyonu: 0 raf, 1 yarma, 2 tesis turu (idleAlt'tan öncelikli) */
  idleVariant?: number;
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
    default: {
      const v = flags.idleVariant ?? (flags.idleAlt ? 1 : 0);
      return v % 3 === 1 ? "slittingLine" : v % 3 === 2 ? "grandTour" : "rackHero";
    }
  }
}
