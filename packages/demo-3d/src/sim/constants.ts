import type { MachineState } from "@metalnest/core";

/** Hat yerleşimi (metre). Sac +X yönünde akar. */
export const LAYOUT = {
  // Ferah yerleşim: makineler arası gerçek fiziksel boşluk (clipping yok,
  // Siemens/NVIDIA sınıfı "büyük tesis" hissi)
  coilX: -8.2,
  coilAxleY: 1.3,
  straightenerX: -5.2,
  tableY: 0.86,
  cutX: 0,
  sheetWidth: 1.2,
  sheetThickness: 0.008,
  palletX: 5.4,
  palletBaseY: 0.16,
} as const;

/** Rulo geometrisi. Kalınlık görsel olarak abartılmıştır (gerçek 2mm'de
 * azalma gözle görülmez) — yarıçap formülü yine fiziksel: r=√(R₀²−L·t/π). */
export const COIL = {
  R0: 0.85,
  RMIN: 0.25,
  THICKNESS: 0.035, // Visually depletes very fast!
  WIDTH: 1.3,
} as const;

export function coilRadiusFor(totalFedLength: number): number {
  const r2 = COIL.R0 ** 2 - (totalFedLength * COIL.THICKNESS) / Math.PI;
  return Math.sqrt(Math.max(r2, COIL.RMIN ** 2));
}

/** Faz süreleri (saniye). */
export const PHASE_DURATION: Record<MachineState, number> = {
  IDLE: 1.4,
  FEEDING: 3.2,
  CUTTING: 4.2,
  LIFTING: 3.6,
};

/** Bir üründen art arda en fazla kaç adet kesilip sonrakine geçileceği (demo temposu). */
export const PIECES_PER_RECOMMENDATION = 3;

/**
 * Frame başına güncellenen değerler. Zustand'a yazılmaz — 60fps'te React
 * re-render tetiklememek için mutable modül nesnesi olarak tutulur.
 */
export const simFrame = {
  /** Aktif fazın 0..1 ilerlemesi. */
  progress: 0,
  /** Bu rulodan bugüne kadar beslenen toplam sac (m). */
  totalFedLength: 0,
  /** Rulonun birikimli dönüş açısı (rad). */
  coilAngle: 0,
  /** Kesim anında yakalanan rulo-seti bombe genliği (m). */
  bowAmpAtCut: 0.03,
  /** Parçanın anlık bombe değeri ve yay hızı (springback entegrasyonu). */
  pieceBow: 0,
  pieceBowVel: 0,
};

/**
 * Rulo hafızası (coil set): sac, masada/merdanelerde bastırılıyken düz görünür;
 * kaldırılınca kalıcı eğrilik geri yaylanır (springback). Rulonun iç sargıları
 * daha sıkı sarıldığından, rulo inceldikçe eğrilik artar.
 */
export function coilSetAmplitude(coilRadius: number): number {
  const depletion = (COIL.R0 - coilRadius) / (COIL.R0 - COIL.RMIN); // 0=dolu, 1=bitmek üzere
  return 0.01 + 0.02 * depletion;
}

export const easeInOut = (t: number): number => t * t * (3 - 2 * t);
