/** Karar Motoru'nun kerf'li grid kuralının (HeuristicScrapEstimator ile aynı)
 * GÖRSEL versiyonu: hücre koordinatları üretir ki yerleşim saca çizilebilsin.
 * Tümü saf fonksiyon — birim: mm. */

export interface NestCell {
  /** Parça sol-alt köşesi, sac koordinatında (mm). x=uzunluk ekseni, z=en ekseni */
  x0: number;
  z0: number;
  w: number; // en (z)
  l: number; // boy (x)
}

export interface Nest {
  cols: number; // en boyunca sütun
  rows: number; // boy boyunca satır
  cells: NestCell[];
  usedWmm: number;
  trimWmm: number;
  scrapRatio: number; // 0..1
  rotated: boolean;
}

function gridFor(pw: number, pl: number, sheetW: number, pieceL: number, kerf: number) {
  const cols = Math.floor((sheetW + kerf) / (pw + kerf));
  const rows = Math.floor((pieceL + kerf) / (pl + kerf));
  return { cols, rows };
}

function buildNest(pw: number, pl: number, sheetW: number, pieceL: number, kerf: number, rotated: boolean): Nest {
  const { cols, rows } = gridFor(pw, pl, sheetW, pieceL, kerf);
  const cells: NestCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x0: r * (pl + kerf), z0: c * (pw + kerf), w: pw, l: pl });
    }
  }
  const usedWmm = cols * pw;
  const usedArea = cols * rows * pw * pl;
  const total = sheetW * pieceL;
  return {
    cols,
    rows,
    cells,
    usedWmm,
    trimWmm: sheetW - usedWmm,
    scrapRatio: total > 0 ? 1 - usedArea / total : 1,
    rotated,
  };
}

/** En iyi yönelimi (normal vs 90° döndürülmüş) seçen nest. */
export function computeNest(
  partWmm: number,
  partLmm: number,
  sheetWmm: number,
  pieceLmm: number,
  kerfMm: number,
): Nest {
  const normal = buildNest(partWmm, partLmm, sheetWmm, pieceLmm, kerfMm, false);
  const rotated = buildNest(partLmm, partWmm, sheetWmm, pieceLmm, kerfMm, true);
  return rotated.cells.length > normal.cells.length ? rotated : normal;
}

export interface NestCandidate {
  label: string;
  scrapPct: number; // 0-100, 1 ondalık
  nest: Nest;
  chosen: boolean;
}

/** Optimizer'ın "düşündüğü" adaylar: normal, döndürülmüş ve tek-sütun
 * varyantları. Kazanan = en düşük fire. HUD bunları sırayla gösterir. */
export function nestCandidates(
  partWmm: number,
  partLmm: number,
  sheetWmm: number,
  pieceLmm: number,
  kerfMm: number,
): NestCandidate[] {
  const pct = (n: Nest) => Math.round(n.scrapRatio * 1000) / 10;
  const normal = buildNest(partWmm, partLmm, sheetWmm, pieceLmm, kerfMm, false);
  const rotated = buildNest(partLmm, partWmm, sheetWmm, pieceLmm, kerfMm, true);
  const single: Nest = {
    ...buildNest(partWmm, partLmm, sheetWmm, pieceLmm, kerfMm, false),
    cols: Math.min(1, normal.cols),
  };
  single.cells = single.cells.filter((c) => c.z0 === 0);
  single.usedWmm = single.cells.length > 0 ? partWmm : 0;
  single.trimWmm = sheetWmm - single.usedWmm;
  single.scrapRatio =
    1 - (single.cells.length * partWmm * partLmm) / (sheetWmm * pieceLmm);

  const cands: NestCandidate[] = [
    { label: "Standart yerleşim", scrapPct: pct(normal), nest: normal, chosen: false },
    { label: "90° döndürülmüş", scrapPct: pct(rotated), nest: rotated, chosen: false },
    { label: "Tek sıra (emniyetli)", scrapPct: pct(single), nest: single, chosen: false },
  ];
  let best = 0;
  for (let i = 1; i < cands.length; i++) if (cands[i].scrapPct < cands[best].scrapPct) best = i;
  cands[best] = { ...cands[best], chosen: true };
  return cands;
}

/** Çelik yoğunluğu (kg/m³) — 304/316 paslanmaz ~7900. */
const STEEL_DENSITY = 7900;

/** Fire kütlesi: oran × (sac alanı) × kalınlık × yoğunluk. Girdi mm, çıktı kg. */
export function scrapKgFor(
  scrapRatio: number,
  sheetWmm: number,
  pieceLmm: number,
  thicknessMm: number,
): number {
  const areaM2 = (sheetWmm / 1000) * (pieceLmm / 1000);
  return scrapRatio * areaM2 * (thicknessMm / 1000) * STEEL_DENSITY;
}

/** Mock hurda değeri — paslanmaz hurda ₺/kg (fuar verisi, ERP'den gelecek). */
export const SCRAP_PRICE_TL_PER_KG = 85;
