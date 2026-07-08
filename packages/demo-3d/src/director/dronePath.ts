import { CatmullRomCurve3, Vector3 } from "three";

/**
 * FPV Dron Turu — mega-fabrikanın üzerinden ve içinden süzülen TEK parça
 * kapalı spline (Catmull-Rom). Kamera konumu ve bakış hedefi ayrı eğrilerde
 * ilerler; getPoint(u) parametre-uzayında örneklenir → seyrek waypoint'li
 * transit bacaklar HIZLI, makine önündeki sık waypoint'ler YAVAŞ geçilir
 * (drone çekimlerindeki doğal tempo). Saf veri + örnekleme: test edilir.
 */

export interface TourWaypoint {
  /** Kamera konumu (dünya, metre) */
  pos: [number, number, number];
  /** Bakış hedefi */
  target: [number, number, number];
  /** Bu waypoint'in ait olduğu sahne adı (alt bant) */
  label: string;
}

const L = {
  intro: "Mega Tesis — Havadan Giriş",
  ctl: "Hat 1 — CNC Kesim Geçişi",
  coil: "Rulo Deposu — Vinç Sahası",
  plasma: "Plazma Kesim — Portal Dalışı",
  coating: "Toz Boya Tüneli — Yüzey İşlem",
  welding: "Robotik Kaynak Hücreleri",
  tube: "Boru Lazer Hattı",
  ship: "Sevkiyat — Bitmiş Ürün & Dok",
} as const;

/** Rota: SE yüksek giriş → ana hat alçak geçiş → rulo sahası → plazma (batı)
 * → toz boya (kuzey) → kaynak (doğu) → boru lazer → sevkiyat → yükseliş.
 * Yükseklikler makine gabarilerinin ≥0.9 m üzerinde seçildi (clipping yok). */
export const TOUR_WAYPOINTS: TourWaypoint[] = [
  { pos: [46, 22, 40], target: [0, 1, 0], label: L.intro },
  { pos: [32, 14, 26], target: [0, 1.1, 0], label: L.intro },
  { pos: [20, 8, 16], target: [0, 1.2, 0], label: L.intro },
  { pos: [10, 2.6, 6], target: [0, 1.2, 0], label: L.ctl },
  { pos: [0, 2.3, 4.6], target: [-4, 1, 0], label: L.ctl },
  { pos: [-8, 2.8, 5.4], target: [-8.2, 1.3, 0], label: L.ctl },
  { pos: [-16, 3.4, 2.5], target: [-13, 1.5, -8], label: L.coil },
  { pos: [-26, 3.2, -2], target: [-30, 1.2, -8], label: L.coil },
  { pos: [-36, 2.8, -3], target: [-41, 0.9, -8], label: L.plasma },
  { pos: [-47, 2.8, -8], target: [-41, 0.9, -8], label: L.plasma },
  { pos: [-44, 3.4, -14], target: [-40, 1, -10], label: L.plasma },
  { pos: [-30, 4.2, -20], target: [-6, 1.5, -24.5], label: L.coating },
  { pos: [-12, 2.9, -20.5], target: [-2, 1.6, -24.5], label: L.coating },
  { pos: [2, 2.7, -20.8], target: [5, 1.6, -24.5], label: L.coating },
  { pos: [14, 3.1, -19], target: [24, 1.2, -14], label: L.coating },
  { pos: [21, 3.0, -9], target: [25.8, 1.4, -14], label: L.welding },
  { pos: [29, 3.2, -9.5], target: [32.2, 1.4, -14], label: L.welding },
  // Viraj transiti: hedef kamerayla birlikte İLERİYE bakar (banking drone)
  { pos: [36, 3.4, -11], target: [44, 1.5, -2], label: L.welding },
  { pos: [39, 3.2, -6.5], target: [33, 1.2, 6], label: L.tube },
  { pos: [40, 2.7, 3], target: [34, 1.3, 6], label: L.tube },
  { pos: [32, 2.5, 2.2], target: [29, 1.1, 6], label: L.tube },
  { pos: [21, 6.5, -9], target: [11, 0.8, -6], label: L.ship },
  { pos: [10, 5.0, 8], target: [15.5, 1, 0.5], label: L.ship },
  { pos: [20, 8, 18], target: [0, 1, 0], label: L.ship },
  { pos: [34, 15, 30], target: [0, 1, 0], label: L.ship },
];

/** Tam tur süresi (sn) — fuar temposu: acele etmeyen kurumsal tanıtım. */
export const TOUR_DURATION = 96;

const N = TOUR_WAYPOINTS.length;
const posCurve = new CatmullRomCurve3(
  TOUR_WAYPOINTS.map((w) => new Vector3(...w.pos)),
  true,
  "centripetal",
);
const tgtCurve = new CatmullRomCurve3(
  TOUR_WAYPOINTS.map((w) => new Vector3(...w.target)),
  true,
  "centripetal",
);

export interface TourSample {
  pos: Vector3;
  target: Vector3;
  label: string;
  /** Aktif sahnenin sırası (1 tabanlı) ve toplam sahne sayısı */
  segIndex: number;
  segCount: number;
}

/** Sahne listesi (waypoint sırasına göre benzersiz etiketler). */
export const TOUR_SEGMENTS: string[] = [...new Set(TOUR_WAYPOINTS.map((w) => w.label))];

const scratchPos = new Vector3();
const scratchTgt = new Vector3();

/** t saniyesindeki dron pozu — kapalı eğri üzerinde döngüsel örnekleme.
 * Dönen Vector3'ler paylaşılan scratch nesneleridir (kare başına alloc yok);
 * çağıran kopyalamadan saklamamalıdır. */
export function sampleTour(tSec: number): TourSample {
  const u = ((tSec / TOUR_DURATION) % 1 + 1) % 1;
  posCurve.getPoint(u, scratchPos);
  tgtCurve.getPoint(u, scratchTgt);
  const label = TOUR_WAYPOINTS[Math.min(N - 1, Math.floor(u * N))].label;
  return {
    pos: scratchPos,
    target: scratchTgt,
    label,
    segIndex: TOUR_SEGMENTS.indexOf(label) + 1,
    segCount: TOUR_SEGMENTS.length,
  };
}
