/** Vardiya matematiği — rozet UI'dan bağımsız, saf ve test edilebilir.
 * Klasik 3-vardiya düzeni: V1 06–14, V2 14–22, V3 22–06 (gece devri). */

export interface ShiftInfo {
  /** 1 | 2 | 3 */
  no: 1 | 2 | 3;
  /** "06:00–14:00" gibi */
  range: string;
  /** Vardiya içinde geçen oran 0..1 (ilerleme çubuğu) */
  progress: number;
}

const SHIFT_H = 8;

export function shiftInfo(d: Date): ShiftInfo {
  const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  if (h >= 6 && h < 14) return { no: 1, range: "06:00–14:00", progress: (h - 6) / SHIFT_H };
  if (h >= 14 && h < 22) return { no: 2, range: "14:00–22:00", progress: (h - 14) / SHIFT_H };
  // Gece vardiyası gece yarısını sarar: 22..24 → 0..2 saat, 0..6 → 2..8 saat
  const elapsed = h >= 22 ? h - 22 : h + 2;
  return { no: 3, range: "22:00–06:00", progress: elapsed / SHIFT_H };
}
