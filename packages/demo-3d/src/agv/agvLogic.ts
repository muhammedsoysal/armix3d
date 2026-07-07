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

/** Tamamlanan paletin stok grid'indeki yeri — Pallet.tsx ile birebir aynı kural. */
export function dropSlotFor(idx: number): { x: number; z: number } {
  const row = idx % 2;
  const col = Math.floor(idx / 2);
  return {
    x: LAYOUT.palletX + 1.8 + col * 1.5,
    z: row === 0 ? 0 : -1.2,
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

/** Tesis çevresi devriye halkası (AGV-02). Raf sahası arkasından dolaşır. */
export const PATROL_LOOP: FloorPath = [
  [9.5, 4.6],
  [-9.8, 4.6],
  [-9.8, -4.6],
  [9.5, -4.6],
  [9.5, 4.6],
];

/** İç devriye halkası (AGV-03) — dış halkayla z=±4.6 şeritlerini PAYLAŞIR:
 * ortak segmentlerde WHCA* rezervasyonu araçları sıraya sokar (canlı kanıt). */
export const INNER_LOOP: FloorPath = [
  [6.2, 4.6],
  [-2.6, 4.6],
  [-2.6, -4.6],
  [6.2, -4.6],
  [6.2, 4.6],
];
