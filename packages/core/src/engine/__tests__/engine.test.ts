import { describe, expect, it } from "vitest";
import { getMockSalesRecords, getMockStockItems, getPartDefinitions } from "../../data/mockCatalog";
import { HeuristicScrapEstimator } from "../ScrapEstimator";
import { PriorityScorer, type ScoringInput } from "../PriorityScorer";
import { ProductionPlanBuilder } from "../ProductionPlanBuilder";

const NOW = new Date("2026-07-06T12:00:00Z");

function buildInputs(): ScoringInput[] {
  const estimator = new HeuristicScrapEstimator();
  const stock = getMockStockItems();
  const salesBySku = new Map(getMockSalesRecords().map((s) => [s.sku, s]));
  // Planner davranışını aynala: stoğu/satışı olmayan parçalar plana girmez
  return getPartDefinitions().flatMap((part) => {
    const bestStock = stock.find((s) => s.materialType === part.materialType);
    const sales = salesBySku.get(part.sku);
    if (!bestStock || !sales) return [];
    return [
      {
        part,
        sales,
        bestStock,
        scrapPercent: estimator.estimateScrapPercent(part, bestStock),
      },
    ];
  });
}

describe("Mock veri", () => {
  it("satışlar Pareto dağılımı gösterir (ürünlerin %25'i satışın %60+'ı)", () => {
    const sales = getMockSalesRecords().sort(
      (a, b) => b.unitsSoldLast30Days - a.unitsSoldLast30Days,
    );
    const total = sales.reduce((s, r) => s + r.unitsSoldLast30Days, 0);
    const topCount = Math.ceil(sales.length * 0.25);
    const topTotal = sales.slice(0, topCount).reduce((s, r) => s + r.unitsSoldLast30Days, 0);
    expect(topTotal / total).toBeGreaterThan(0.6);
  });

  it("3-5 kalem atıl stok (isStale) içerir", () => {
    const staleCount = getMockStockItems().filter((s) => s.isStale).length;
    expect(staleCount).toBeGreaterThanOrEqual(3);
    expect(staleCount).toBeLessThanOrEqual(5);
  });
});

describe("HeuristicScrapEstimator", () => {
  it("fire yüzdesi 0-100 aralığındadır ve sığmayan parça %100 verir", () => {
    const estimator = new HeuristicScrapEstimator();
    const stock = getMockStockItems()[0];
    for (const part of getPartDefinitions()) {
      const scrap = estimator.estimateScrapPercent(part, stock);
      expect(scrap).toBeGreaterThanOrEqual(0);
      expect(scrap).toBeLessThanOrEqual(100);
    }
    const huge = {
      ...getPartDefinitions()[0],
      partDimensions: { width: 5000, length: 5000 },
    };
    expect(estimator.estimateScrapPercent(huge, stock)).toBe(100);
  });
});

describe("PriorityScorer — ağırlık değişimi sırayı değiştirir", () => {
  it("sadece satış ağırlığı → en çok satan (PRT-001) başa gelir", () => {
    const scored = new PriorityScorer(
      { salesWeight: 1, staleStockWeight: 0, wasteWeight: 0 },
      NOW,
    ).score(buildInputs());
    expect(scored[0].part.sku).toBe("PRT-001");
  });

  it("sadece atıl stok ağırlığı → en yaşlı stoğu kullanan başa gelir", () => {
    const inputs = buildInputs();
    const scored = new PriorityScorer(
      { salesWeight: 0, staleStockWeight: 1, wasteWeight: 0 },
      NOW,
    ).score(inputs);
    const maxAge = Math.max(
      ...inputs.map((i) => (NOW.getTime() - i.bestStock.arrivalDate.getTime()) / 86_400_000),
    );
    const topAge = (NOW.getTime() - scored[0].bestStock.arrivalDate.getTime()) / 86_400_000;
    expect(Math.floor(topAge)).toBe(Math.floor(maxAge));
  });

  it("sadece fire ağırlığı → en düşük fire başa gelir", () => {
    const scored = new PriorityScorer(
      { salesWeight: 0, staleStockWeight: 0, wasteWeight: 1 },
      NOW,
    ).score(buildInputs());
    const scraps = scored.map((s) => s.scrapPercent);
    expect(scraps[0]).toBe(Math.min(...scraps));
  });
});

describe("ProductionPlanBuilder", () => {
  const build = (weights: { salesWeight: number; staleStockWeight: number; wasteWeight: number }) =>
    new ProductionPlanBuilder(new HeuristicScrapEstimator()).build({
      parts: getPartDefinitions(),
      stock: getMockStockItems(),
      sales: getMockSalesRecords(),
      weights,
      now: NOW,
    });

  it("tüm ürünler için öneri üretir, reasoning Türkçe ve dolu", () => {
    const plan = build({ salesWeight: 0.5, staleStockWeight: 0.3, wasteWeight: 0.2 });
    // Paslanmaz veri revizyonundan beri her parçanın stok karşılığı yok —
    // planner stok+satışı olanları önerir (buildInputs ile aynı kural)
    expect(plan.recommendations.length).toBe(buildInputs().length);
    expect(plan.recommendations.length).toBeGreaterThan(0);
    for (const rec of plan.recommendations) {
      expect(rec.recommendedQuantity).toBeGreaterThan(0);
      expect(rec.sourceStockItems.length).toBeGreaterThan(0);
      expect(rec.reasoning).toContain("fire");
      expect(rec.reasoning).toMatch(/en çok satan \d+\. ürünü/);
    }
    expect(plan.totalEstimatedScrapPercent).toBeGreaterThanOrEqual(0);
    expect(plan.totalEstimatedScrapPercent).toBeLessThanOrEqual(100);
    expect(plan.staleStockClearedPercent).toBeGreaterThan(0);
  });

  it("atıl stok varken malzemesi uyan öneriler atıl stoğu kaynak seçer", () => {
    const plan = build({ salesWeight: 0.5, staleStockWeight: 0.3, wasteWeight: 0.2 });
    const usesStale = plan.recommendations.some((r) => r.sourceStockItems.some((s) => s.isStale));
    expect(usesStale).toBe(true);
  });

  it("ağırlıklar değişince plan sırası değişir (satış-odaklı ↔ atıl-stok-odaklı)", () => {
    const salesFocused = build({ salesWeight: 1, staleStockWeight: 0, wasteWeight: 0 });
    const staleFocused = build({ salesWeight: 0, staleStockWeight: 1, wasteWeight: 0 });
    const orderA = salesFocused.recommendations.map((r) => r.sku).join(",");
    const orderB = staleFocused.recommendations.map((r) => r.sku).join(",");
    expect(orderA).not.toBe(orderB);
  });
});
