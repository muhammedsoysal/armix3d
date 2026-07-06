import type { PartDefinition, SalesRecord, ScorerWeights, StockItem } from "../models";

export interface ScoringInput {
  part: PartDefinition;
  sales: SalesRecord;
  bestStock: StockItem;
  scrapPercent: number;
}

export interface ScoredItem extends ScoringInput {
  priorityScore: number;
  normalizedSalesVelocity: number;
  normalizedStockAge: number;
  stockAgeDays: number;
  salesRank: number;
}

export function stockAgeDays(stock: StockItem, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - stock.arrivalDate.getTime()) / 86_400_000));
}

/**
 * Deterministik skorlama:
 *   priorityScore = salesWeight * normSatışHızı
 *                 + staleStockWeight * normStokYaşı
 *                 - wasteWeight * normFire
 * LLM/AI çağrısı yoktur; tüm girdiler açıklanabilir ve test edilebilir.
 */
export class PriorityScorer {
  constructor(
    private readonly weights: ScorerWeights,
    private readonly now: Date = new Date(),
  ) {}

  score(inputs: ScoringInput[]): ScoredItem[] {
    if (inputs.length === 0) return [];

    const maxSales = Math.max(...inputs.map((i) => i.sales.unitsSoldLast30Days), 1);
    const ages = inputs.map((i) => stockAgeDays(i.bestStock, this.now));
    const maxAge = Math.max(...ages, 1);

    const salesDesc = [...inputs].sort(
      (a, b) => b.sales.unitsSoldLast30Days - a.sales.unitsSoldLast30Days,
    );
    const rankOf = new Map(salesDesc.map((i, idx) => [i.part.sku, idx + 1]));

    const scored = inputs.map((input, idx): ScoredItem => {
      const normalizedSalesVelocity = input.sales.unitsSoldLast30Days / maxSales;
      const normalizedStockAge = ages[idx] / maxAge;
      const normalizedScrap = input.scrapPercent / 100;
      const priorityScore =
        this.weights.salesWeight * normalizedSalesVelocity +
        this.weights.staleStockWeight * normalizedStockAge -
        this.weights.wasteWeight * normalizedScrap;
      return {
        ...input,
        priorityScore: Math.round(priorityScore * 1000) / 1000,
        normalizedSalesVelocity,
        normalizedStockAge,
        stockAgeDays: ages[idx],
        salesRank: rankOf.get(input.part.sku) ?? inputs.length,
      };
    });

    return scored.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
