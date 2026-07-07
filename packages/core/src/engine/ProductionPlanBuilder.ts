import type {
  PartDefinition,
  PlanRecommendation,
  ProductionPlan,
  SalesRecord,
  ScorerWeights,
  StockItem,
} from "../models";
import type { IScrapEstimator } from "./ScrapEstimator";
import { PriorityScorer, stockAgeDays, type ScoringInput } from "./PriorityScorer";
import { ReasoningTextBuilder } from "./ReasoningTextBuilder";
import { forecastFromSales, forecastSentence } from "./Forecast";

export interface BuildPlanParams {
  parts: PartDefinition[];
  stock: StockItem[];
  sales: SalesRecord[];
  weights: ScorerWeights;
  now?: Date;
}

export class ProductionPlanBuilder {
  constructor(
    private readonly scrapEstimator: IScrapEstimator,
    private readonly reasoningBuilder: ReasoningTextBuilder = new ReasoningTextBuilder(),
  ) {}

  build({ parts, stock, sales, weights, now = new Date() }: BuildPlanParams): ProductionPlan {
    const salesBySku = new Map(sales.map((s) => [s.sku, s]));

    const inputs: ScoringInput[] = [];
    for (const part of parts) {
      const salesRecord = salesBySku.get(part.sku);
      if (!salesRecord) continue;
      const bestStock = this.pickBestStock(part, stock, now);
      if (!bestStock) continue;
      inputs.push({
        part,
        sales: salesRecord,
        bestStock,
        scrapPercent: this.scrapEstimator.estimateScrapPercent(part, bestStock),
      });
    }

    const scored = new PriorityScorer(weights, now).score(inputs);

    const recommendations: PlanRecommendation[] = scored.map((item) => {
      const weeklyDemand = Math.ceil((item.sales.unitsSoldLast30Days / 30) * 7);
      const capacity =
        item.bestStock.quantityAvailable *
        Math.max(this.scrapEstimator.partsPerSheet(item.part, item.bestStock), 1);
      return {
        sku: item.part.sku,
        productName: item.part.productName,
        recommendedQuantity: Math.max(1, Math.min(weeklyDemand, capacity)),
        sourceStockItems: [item.bestStock],
        estimatedScrapPercent: item.scrapPercent,
        priorityScore: item.priorityScore,
        // Şablon gerekçe + Holt talep tahmini (trend ve %90 güven aralığı)
        reasoning: this.reasoningBuilder.build(item) + forecastSentence(forecastFromSales(item.sales)),
      };
    });

    const totalQty = recommendations.reduce((sum, r) => sum + r.recommendedQuantity, 0);
    const totalEstimatedScrapPercent =
      totalQty === 0
        ? 0
        : Math.round(
            (recommendations.reduce(
              (sum, r) => sum + r.estimatedScrapPercent * r.recommendedQuantity,
              0,
            ) /
              totalQty) *
              10,
          ) / 10;

    const staleSkus = new Set(stock.filter((s) => s.isStale).map((s) => s.sku));
    const usedStaleSkus = new Set(
      recommendations
        .flatMap((r) => r.sourceStockItems)
        .filter((s) => s.isStale)
        .map((s) => s.sku),
    );
    const staleStockClearedPercent =
      staleSkus.size === 0 ? 0 : Math.round((usedStaleSkus.size / staleSkus.size) * 1000) / 10;

    return { recommendations, totalEstimatedScrapPercent, staleStockClearedPercent };
  }

  /** Malzemesi uyan stoklar içinden seçim — öncelik sırası:
   *  1) EN AZ FİRE: parça bu stokta en verimli nasıl yerleşiyorsa o
   *     (aynı parça 1000mm ruloda %40, 1500mm'de %8 fire verebilir!)
   *  2) Fire eşitse: atıl (stale) stok — depoyu eritmek için
   *  3) Hâlâ eşitse: en yaşlı stok (FIFO)
   * Böylece çok satan ürünler otomatik olarak en verimli stoktan kesilir. */
  private pickBestStock(part: PartDefinition, stock: StockItem[], now: Date): StockItem | null {
    const candidates = stock.filter(
      (s) => s.materialType === part.materialType && s.quantityAvailable > 0,
    );
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => {
      const scrapDiff =
        this.scrapEstimator.estimateScrapPercent(part, a) -
        this.scrapEstimator.estimateScrapPercent(part, b);
      if (Math.abs(scrapDiff) > 0.5) return scrapDiff; // %0.5'ten büyük fark: fire kazanır
      if (!!a.isStale !== !!b.isStale) return a.isStale ? -1 : 1;
      return stockAgeDays(b, now) - stockAgeDays(a, now);
    })[0];
  }
}
