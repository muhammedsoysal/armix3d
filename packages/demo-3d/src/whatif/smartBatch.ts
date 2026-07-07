import { packGuillotine, type PackResult, type PartDefinition } from "@metalnest/core";

/**
 * Akıllı Sipariş Gruplama: aynı malzeme sınıfındaki SKU'ları AYNI levhada
 * karıştırarak paketler (küçük parçalar büyüklerin artığını doldurur).
 * Taban çizgisi: her SKU kendi levhasında (bugünkü üretim pratiği).
 */

export interface BatchSheet extends PackResult {
  sheetNo: number;
}

export interface MaterialBatch {
  material: string;
  sheets: BatchSheet[];
  /** Karışık paketleme ortalama fire (%) */
  avgScrapPct: number;
  /** Tek-SKU-tek-levha taban çizgisi ortalama fire (%) */
  naiveScrapPct: number;
}

export function computeSmartBatches(
  parts: PartDefinition[],
  demand: Record<string, number>,
  sheetWmm: number,
  sheetLmm: number,
  kerfMm: number,
): MaterialBatch[] {
  const byMaterial = new Map<string, PartDefinition[]>();
  for (const p of parts) {
    if (!demand[p.sku]) continue;
    const list = byMaterial.get(p.materialType) ?? [];
    list.push(p);
    byMaterial.set(p.materialType, list);
  }

  const batches: MaterialBatch[] = [];
  for (const [material, group] of byMaterial) {
    // KARIŞIK: kalan talep bitene kadar levha levha paketle
    const remaining = new Map(group.map((p) => [p.sku, demand[p.sku] ?? 0]));
    const sheets: BatchSheet[] = [];
    let guard = 0;
    while ([...remaining.values()].some((q) => q > 0) && guard++ < 200) {
      const pieces = group
        .filter((p) => (remaining.get(p.sku) ?? 0) > 0)
        .map((p) => ({
          id: p.sku,
          w: p.partDimensions.width,
          l: p.partDimensions.length,
          qty: remaining.get(p.sku)!,
        }));
      const pack = packGuillotine(pieces, sheetWmm, sheetLmm, kerfMm);
      if (pack.placements.length === 0) break; // hiçbiri sığmıyor
      for (const pl of pack.placements) {
        remaining.set(pl.id, (remaining.get(pl.id) ?? 0) - 1);
      }
      sheets.push({ ...pack, sheetNo: sheets.length + 1 });
    }
    const avgScrapPct =
      sheets.length > 0
        ? Math.round((sheets.reduce((s, x) => s + x.scrapPct, 0) / sheets.length) * 10) / 10
        : 0;

    // NAİF taban çizgisi: her SKU yalnız başına levhalara
    let naiveScrapSum = 0;
    let naiveSheets = 0;
    for (const p of group) {
      let left = demand[p.sku] ?? 0;
      let g2 = 0;
      while (left > 0 && g2++ < 200) {
        const pack = packGuillotine(
          [{ id: p.sku, w: p.partDimensions.width, l: p.partDimensions.length, qty: left }],
          sheetWmm,
          sheetLmm,
          kerfMm,
        );
        if (pack.placements.length === 0) break;
        left -= pack.placements.length;
        naiveScrapSum += pack.scrapPct;
        naiveSheets++;
      }
    }
    batches.push({
      material,
      sheets,
      avgScrapPct,
      naiveScrapPct: naiveSheets > 0 ? Math.round((naiveScrapSum / naiveSheets) * 10) / 10 : 0,
    });
  }
  return batches;
}
