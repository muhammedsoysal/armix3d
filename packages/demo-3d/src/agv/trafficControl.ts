/**
 * AGV trafik kontrolü — WHCA* (Windowed Hierarchical Cooperative A*, Silver
 * 2005) fikrinin şerit-ağına indirgenmiş hali: her araç KISA BİR PENCEREDE
 * (mevcut + önündeki hücre) rezervasyon ister; dolu hücreye giren yoktur,
 * bekler. Rotalar sabit şerit poligonları olduğundan tam A* aramasına gerek
 * kalmaz — pencereli rezervasyon çarpışmasızlığı tek başına garanti eder.
 */

export const CELL_M = 1.2;

export function cellOf(x: number, z: number): string {
  return `${Math.round(x / CELL_M)},${Math.round(z / CELL_M)}`;
}

export class TrafficController {
  private occupancy = new Map<string, string>();

  /** Aracın yeni penceresini rezerve etmeye çalış. Reddedilirse araç BEKLER
   * (eski rezervasyonu korunur — kilitlenme yerine sıralı geçiş). */
  request(id: string, cells: string[]): boolean {
    for (const c of cells) {
      const owner = this.occupancy.get(c);
      if (owner && owner !== id) return false;
    }
    for (const [c, o] of this.occupancy) {
      if (o === id) this.occupancy.delete(c);
    }
    for (const c of cells) this.occupancy.set(c, id);
    return true;
  }

  release(id: string): void {
    for (const [c, o] of this.occupancy) {
      if (o === id) this.occupancy.delete(c);
    }
  }
}

/** Sahadaki tüm AGV'lerin paylaştığı tek kontrolcü. */
export const traffic = new TrafficController();
