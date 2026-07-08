import { LAYOUT } from "../sim/constants";

/** Zemin düzleminde (x,z) polyline. Y her zaman 0 — AGV uçmaz. */
export type FloorPath = [number, number][];

export interface PathPoint {
  x: number;
  z: number;
  /** Y ekseni etrafında yön (atan2(dx,dz)) — mesh.rotation.y'ye doğrudan yazılır */
  heading: number;
  done: boolean;
}

/** Polyline toplam uzunluğu (m). */
export function pathLength(path: FloorPath): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  }
  return total;
}

/** Yol üzerinde `s` metre yürü: konum + yön. Sona gelince kenetlenir.
 * Saf fonksiyon — AGV hareketinin tamamı buradan geçer, test edilir. */
export function pointAlongPath(path: FloorPath, s: number): PathPoint {
  let remaining = Math.max(0, s);
  let heading = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dz = path[i][1] - path[i - 1][1];
    const segLen = Math.hypot(dx, dz);
    if (segLen < 1e-9) continue;
    heading = Math.atan2(dx, dz);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return {
        x: path[i - 1][0] + dx * t,
        z: path[i - 1][1] + dz * t,
        heading,
        done: false,
      };
    }
    remaining -= segLen;
  }
  const last = path[path.length - 1];
  return { x: last[0], z: last[1], heading, done: true };
}

/** Bitmiş Ürün Deposu (sevkiyat sahası) — adanmış bölge: hat çıkışının
 * sağ-arkası, kamyon rampasına komşu. 3 sıra × N sütun grid. */
export const FG_WAREHOUSE = { x0: 11.0, z0: -0.6, colStep: 1.5, rowStep: 1.6, rows: 3 } as const;

/** Tamamlanan paletin depo hücresi — Pallet.tsx ile birebir aynı kural. */
export function dropSlotFor(idx: number): { x: number; z: number } {
  const row = idx % FG_WAREHOUSE.rows;
  const col = Math.floor(idx / FG_WAREHOUSE.rows);
  return {
    x: FG_WAREHOUSE.x0 + col * FG_WAREHOUSE.colStep,
    z: FG_WAREHOUSE.z0 - row * FG_WAREHOUSE.rowStep,
  };
}

/** Dolan paletlerin AGV'yi beklediği ara istasyon (aktif paletin önü). */
export const STAGING = { x: LAYOUT.palletX, z: 1.35 } as const;

/** AGV-01 şarj istasyonu. */
export const DOCK = { x: 8.2, z: 3.2 } as const;

/** Lojistik koridor şeridi (z) — tüm taşıma rotaları bu hattan geçer,
 * gerçek AGV tesislerindeki manhattan-grid görünümünü verir. */
const CORRIDOR_Z = 2.2;

export interface MissionLegs {
  toPickup: FloorPath;
  toDrop: FloorPath;
  toHome: FloorPath;
}

/** Dock → istasyon → grid hücresi → dock; dik açılı (manhattan) bacaklar. */
export function missionLegs(
  pickup: { x: number; z: number },
  drop: { x: number; z: number },
): MissionLegs {
  return {
    toPickup: [
      [DOCK.x, DOCK.z],
      [pickup.x, CORRIDOR_Z],
      [pickup.x, pickup.z],
    ],
    toDrop: [
      [pickup.x, pickup.z],
      [pickup.x, CORRIDOR_Z],
      [drop.x, CORRIDOR_Z],
      [drop.x, drop.z],
    ],
    toHome: [
      [drop.x, drop.z],
      [drop.x, CORRIDOR_Z],
      [DOCK.x, DOCK.z],
    ],
  };
}

/** Tesis çevresi devriye halkası (AGV-02). Mega-fabrika zarfının ~3.5 m içi. */
export const PATROL_LOOP: FloorPath = [
  [46, 26],
  [-46, 26],
  [-46, -27.4],
  [46, -27.4],
  [46, 26],
];

/** Doğu servis halkası (AGV-04): kaynak hücreleri + boru lazeri ana
 * koridora bağlar — FG rafları (x 10..16) ve kamyonun DOĞUSUNDAN dolaşır,
 * kaynak çitine (z −11.7) ve boru lazer yatağına (z 4.5..7.5) girmez. */
export const EAST_LOOP: FloorPath = [
  [19, 2.2],
  [40, 2.2],
  [40, -18],
  [19, -18],
  [19, 2.2],
];

/** Batı servis halkası (AGV-05): plazma kanadını ana koridora bağlar —
 * rulo deposunun (B1: x −19.5..−5.5) ve plazma masasının batı kenarından
 * ≥1.5 m açıklıkla geçer. */
export const WEST_LOOP: FloorPath = [
  [-23, 4],
  [-47.5, 4],
  [-47.5, -18],
  [-23, -18],
  [-23, 4],
];

/** İç devriye halkası (AGV-03) — dış halkayla z=±4.6 şeritlerini PAYLAŞIR:
 * ortak segmentlerde WHCA* rezervasyonu araçları sıraya sokar (canlı kanıt). */
export const INNER_LOOP: FloorPath = [
  // Güney servis halkası: pres/lazer adasının çevresi — ana hattı KESMEZ,
  // makinelerden ≥1 m açıklıkla geçer (clipping sıfır)
  [7.6, -2.3],
  [-4.0, -2.3],
  [-4.0, -6.6],
  [7.6, -6.6],
  [7.6, -2.3],
];
