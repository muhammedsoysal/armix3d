/** Filo poz kayıt defteri — araçlar her kare buraya yazar (react DIŞI,
 * sıfır render maliyeti); Mini-Harita 10 Hz'de okuyup canvas'a çizer. */

export type VehicleKind = "agv" | "forklift";

export interface FleetPose {
  x: number;
  z: number;
  /** rad, +z = 0 (pointAlongPath konvansiyonu) */
  heading: number;
  kind: VehicleKind;
}

const poses = new Map<string, FleetPose>();

export function reportPose(id: string, x: number, z: number, heading: number, kind: VehicleKind = "agv"): void {
  const p = poses.get(id);
  if (p) {
    p.x = x;
    p.z = z;
    p.heading = heading; // mevcut nesneyi güncelle — kare başına alloc yok
  } else {
    poses.set(id, { x, z, heading, kind });
  }
}

export function getPoses(): ReadonlyMap<string, FleetPose> {
  return poses;
}
