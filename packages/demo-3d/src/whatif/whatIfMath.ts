import type { PartDefinition, ProductionPlan, SalesRecord } from "@metalnest/core";

/** Demo tempo: bir parçanın tam makine çevrimi (IDLE+FEEDING+CUTTING+LIFTING, sn). */
const CYCLE_SECONDS = 12.4;
/** Kütle/para varsayımları — ScrapBin ile aynı (₺85/kg, 1.5mm 304, ρ=7900). */
const THICKNESS_MM = 1.5;
const DENSITY = 7900;
const SCRAP_PRICE_TL_PER_KG = 85;

/**
 * Acil siparişi satış geçmişine enjekte eder: KARAR MOTORUNA YALAN SÖYLEMEZ,
 * sadece talebi günceller — motor kendi kurallarıyla yeniden sıralar.
 * Saf fonksiyon: girdi dizisi mutasyona uğramaz.
 */
export function injectRushOrder(
  sales: SalesRecord[],
  part: PartDefinition,
  rushQty: number,
): SalesRecord[] {
  const existing = sales.find((s) => s.sku === part.sku);
  const boosted: SalesRecord = existing
    ? {
        ...existing,
        unitsSoldLast30Days: existing.unitsSoldLast30Days + rushQty * 4,
        unitsSoldLast90Days: existing.unitsSoldLast90Days + rushQty * 4,
        revenueLast30Days: existing.revenueLast30Days * (1 + rushQty / Math.max(existing.unitsSoldLast30Days, 1)),
        trend: "rising",
      }
    : {
        sku: part.sku,
        productName: part.productName,
        unitsSoldLast30Days: rushQty * 4,
        unitsSoldLast90Days: rushQty * 4,
        revenueLast30Days: 0,
        trend: "rising",
      };
  return [...sales.filter((s) => s.sku !== part.sku), boosted];
}

export interface PlanDiff {
  scrapOldPct: number;
  scrapNewPct: number;
  /** + = fire arttı (kötü), − = azaldı (iyi) */
  scrapDeltaPct: number;
  /** 1 tabanlı sıra; 0 = planda yok */
  rushRankOld: number;
  rushRankNew: number;
  jobsOld: number;
  jobsNew: number;
  makespanOldMin: number;
  makespanNewMin: number;
  /** + = tasarruf (iyi), − = ek maliyet. Fire farkının plan kütlesi üzerindeki ₺ etkisi. */
  moneyDeltaTL: number;
}

function planMassKg(plan: ProductionPlan, parts: Record<string, PartDefinition>): number {
  let m = 0;
  for (const r of plan.recommendations) {
    const p = parts[r.sku];
    if (!p) continue;
    const areaM2 = (p.partDimensions.width / 1000) * (p.partDimensions.length / 1000);
    m += r.recommendedQuantity * areaM2 * (THICKNESS_MM / 1000) * DENSITY;
  }
  return m;
}

function makespanMin(plan: ProductionPlan): number {
  const pieces = plan.recommendations.reduce((s, r) => s + r.recommendedQuantity, 0);
  return Math.round(((pieces * CYCLE_SECONDS) / 60) * 10) / 10;
}

/** İki planın yönetici-diline çevrilmiş farkı. Saf fonksiyon — test edilir. */
export function diffPlans(
  oldPlan: ProductionPlan,
  newPlan: ProductionPlan,
  parts: Record<string, PartDefinition>,
  rushSku: string,
): PlanDiff {
  const rank = (p: ProductionPlan) => p.recommendations.findIndex((r) => r.sku === rushSku) + 1;
  const scrapOldPct = oldPlan.totalEstimatedScrapPercent;
  const scrapNewPct = newPlan.totalEstimatedScrapPercent;
  const scrapDeltaPct = Math.round((scrapNewPct - scrapOldPct) * 10) / 10;
  // Fire farkı × yeni plan kütlesi → ₺ (negatif delta = tasarruf = pozitif ₺)
  const moneyDeltaTL = Math.round(
    ((scrapOldPct - scrapNewPct) / 100) * planMassKg(newPlan, parts) * SCRAP_PRICE_TL_PER_KG,
  );
  return {
    scrapOldPct,
    scrapNewPct,
    scrapDeltaPct,
    rushRankOld: rank(oldPlan),
    rushRankNew: rank(newPlan),
    jobsOld: oldPlan.recommendations.length,
    jobsNew: newPlan.recommendations.length,
    makespanOldMin: makespanMin(oldPlan),
    makespanNewMin: makespanMin(newPlan),
    moneyDeltaTL,
  };
}
