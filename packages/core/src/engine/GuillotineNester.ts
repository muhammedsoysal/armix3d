import type { PartDefinition, StockItem } from "../models";
import type { IScrapEstimator } from "./ScrapEstimator";

/**
 * Giyotin kısıtlı 2D nesting — Guillotine-BAF (Best Area Fit) +
 * SplitShorterLeftoverAxis + serbest-dikdörtgen birleştirme (RM).
 * Her yerleşim, boş alanı iki ayrık dikdörtgene böler → sonuç her zaman
 * boydan boya (giyotin) kesimlerle üretilebilir; makas/CTL hattı için şart.
 * Referans: Jylänki, "A Thousand Ways to Pack the Bin" (2010), §4.
 */

export interface PackPiece {
  id: string;
  w: number; // mm (en)
  l: number; // mm (boy)
  qty: number;
}

export interface Placement {
  id: string;
  x: number; // en ekseni konumu (0..sheetW)
  y: number; // boy ekseni konumu (0..sheetL)
  w: number; // en boyutu
  l: number; // boy boyutu
  rotated: boolean;
}

export interface PackResult {
  placements: Placement[];
  /** Yerleşen alan / levha alanı (0..1) — kerf şişirmesi HARİÇ gerçek parça alanı */
  utilization: number;
  scrapPct: number;
  /** Sığmayan parçalar (id → adet) */
  unplaced: Record<string, number>;
}

interface FreeRect {
  x: number; // en ekseni konumu
  y: number; // boy ekseni konumu
  w: number; // en boyutu
  l: number; // boy boyutu
}

type ScoreMode = "baf" | "bssf";

/** Kerf'li çok-SKU giyotin paketleme. 4 sezgisel varyant (BAF/BSSF ×
 * normal/döndürülmüş öncelik) koşulur, en yüksek doluluk kazanır —
 * tek geçişli açgözlünün yönelim körlüğünü kırar. */
export function packGuillotine(
  pieces: PackPiece[],
  sheetW: number,
  sheetL: number,
  kerf: number,
): PackResult {
  let best: PackResult | null = null;
  for (const mode of ["baf", "bssf"] as ScoreMode[]) {
    for (const rotFirst of [false, true]) {
      const r = packOnce(pieces, sheetW, sheetL, kerf, mode, rotFirst);
      if (!best || r.utilization > best.utilization) best = r;
    }
  }
  return best!;
}

function packOnce(
  pieces: PackPiece[],
  sheetW: number,
  sheetL: number,
  kerf: number,
  mode: ScoreMode,
  rotFirst: boolean,
): PackResult {
  // Kerf modeli: parça (w+kerf, l+kerf) hücresi kaplar, levha (W+kerf, L+kerf)
  // sanal alanına açılır — HeuristicScrapEstimator grid formülüyle tutarlı.
  const free: FreeRect[] = [{ x: 0, y: 0, w: sheetW + kerf, l: sheetL + kerf }];
  const placements: Placement[] = [];
  const unplaced: Record<string, number> = {};

  // Büyük parçalar önce (alan azalan) — BAF'ın klasik ön-sıralaması
  const queue = pieces
    .flatMap((p) => Array.from({ length: p.qty }, () => p))
    .sort((a, b) => b.w * b.l - a.w * a.l);

  const orientations = rotFirst ? ([true, false] as const) : ([false, true] as const);

  for (const piece of queue) {
    let best: { idx: number; rotated: boolean; waste: number } | null = null;
    for (let i = 0; i < free.length; i++) {
      const r = free[i];
      for (const rotated of orientations) {
        const pw = (rotated ? piece.l : piece.w) + kerf;
        const pl = (rotated ? piece.w : piece.l) + kerf;
        if (pw <= r.w && pl <= r.l) {
          const waste =
            mode === "baf"
              ? r.w * r.l - pw * pl // Best Area Fit
              : Math.min(r.w - pw, r.l - pl); // Best Short Side Fit
          if (!best || waste < best.waste) best = { idx: i, rotated, waste };
        }
      }
    }
    if (!best) {
      unplaced[piece.id] = (unplaced[piece.id] ?? 0) + 1;
      continue;
    }

    const r = free[best.idx];
    const pw = (best.rotated ? piece.l : piece.w) + kerf;
    const pl = (best.rotated ? piece.w : piece.l) + kerf;
    placements.push({
      id: piece.id,
      x: r.x,
      y: r.y,
      w: best.rotated ? piece.l : piece.w,
      l: best.rotated ? piece.w : piece.l,
      rotated: best.rotated,
    });

    // Giyotin bölme: kalan L-şekli iki AYRIK dikdörtgene ayrılır.
    // SplitShorterLeftoverAxis: kısa artık ekseni boyunca böl → kareye
    // yakın boşluklar kalır (literatürde en iyi genel amaçlı kural).
    free.splice(best.idx, 1);
    const leftoverW = r.w - pw; // en yönü artığı
    const leftoverL = r.l - pl; // boy yönü artığı
    if (leftoverW <= leftoverL) {
      // yatay kes: alt şerit TAM EN, sağ şerit parça boyunda
      if (leftoverL > 0) free.push({ x: r.x, y: r.y + pl, w: r.w, l: leftoverL });
      if (leftoverW > 0) free.push({ x: r.x + pw, y: r.y, w: leftoverW, l: pl });
    } else {
      // dikey kes: sağ şerit TAM BOY, alt şerit parça eninde
      if (leftoverW > 0) free.push({ x: r.x + pw, y: r.y, w: leftoverW, l: r.l });
      if (leftoverL > 0) free.push({ x: r.x, y: r.y + pl, w: pw, l: leftoverL });
    }
    mergeFreeRects(free);
  }

  const placedArea = placements.reduce((s, p) => s + p.w * p.l, 0);
  const total = sheetW * sheetL;
  return {
    placements,
    utilization: total > 0 ? placedArea / total : 0,
    scrapPct: Math.round((1 - placedArea / total) * 1000) / 10,
    unplaced,
  };
}

/** Yan yana/aynı boyutlu komşu boşlukları birleştir (RM) — parçalanmayı azaltır. */
function mergeFreeRects(free: FreeRect[]): void {
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const a = free[i];
        const b = free[j];
        // Yatay komşu (aynı boy şeridi): en'leri birleştir
        if (a.y === b.y && a.l === b.l && a.x + a.w === b.x) {
          a.w += b.w;
          free.splice(j, 1);
          merged = true;
          break outer;
        }
        // Dikey komşu (aynı en şeridi): boyları birleştir
        if (a.x === b.x && a.w === b.w && a.y + a.l === b.y) {
          a.l += b.l;
          free.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
}

/**
 * Giyotin nesting tabanlı fire tahmincisi — HeuristicScrapEstimator'ın
 * (grid) drop-in yükseltmesi. Karışık yönelim sayesinde asla grid'den
 * kötü değildir (testle garanti edilir).
 */
export class GuillotineScrapEstimator implements IScrapEstimator {
  private readonly kerf: number;

  constructor(kerfMm = 5) {
    this.kerf = kerfMm;
  }

  private pack(part: PartDefinition, stock: StockItem) {
    const { width: sw, length: sl } = stock.dimensions;
    const { width: pw, length: pl } = part.partDimensions;
    const maxQty = Math.ceil(((sw + this.kerf) * (sl + this.kerf)) / (pw * pl));
    return packGuillotine([{ id: part.sku, w: pw, l: pl, qty: maxQty }], sw, sl, this.kerf);
  }

  partsPerSheet(part: PartDefinition, stock: StockItem): number {
    return this.pack(part, stock).placements.length;
  }

  estimateScrapPercent(part: PartDefinition, stock: StockItem): number {
    const r = this.pack(part, stock);
    return r.placements.length === 0 ? 100 : r.scrapPct;
  }
}
