import type { PartDefinition, StockItem } from "../models";

/**
 * Fire tahmincisi arayüzü. v1 heuristiktir; ileride gerçek nesting motoru
 * (MetalNest Studio) bu arayüzün arkasına takılabilir.
 */
export interface IScrapEstimator {
  /** Bir levhaya kaç parça sığar (döndürme dahil basit grid yerleşimi). */
  partsPerSheet(part: PartDefinition, stock: StockItem): number;
  /** Tahmini fire yüzdesi (0-100). */
  estimateScrapPercent(part: PartDefinition, stock: StockItem): number;
}

/** Kesim aralığı payı (mm) — lazer/plazma kerf + parça arası emniyet. */
const KERF_MM = 5;

export class HeuristicScrapEstimator implements IScrapEstimator {
  partsPerSheet(part: PartDefinition, stock: StockItem): number {
    const { width: sw, length: sl } = stock.dimensions;
    const { width: pw, length: pl } = part.partDimensions;
    // Parçalar arası kerf: n parça için (n-1) aralık → (boyut+kerf) hücreleri
    const grid = (w: number, l: number) =>
      Math.floor((sw + KERF_MM) / (w + KERF_MM)) * Math.floor((sl + KERF_MM) / (l + KERF_MM));
    return Math.max(grid(pw, pl), grid(pl, pw));
  }

  estimateScrapPercent(part: PartDefinition, stock: StockItem): number {
    const count = this.partsPerSheet(part, stock);
    if (count === 0) return 100;
    const { width: sw, length: sl } = stock.dimensions;
    const { width: pw, length: pl } = part.partDimensions;
    const usedRatio = (count * pw * pl) / (sw * sl);
    return Math.round((1 - usedRatio) * 1000) / 10;
  }
}
