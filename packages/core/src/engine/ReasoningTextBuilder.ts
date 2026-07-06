import type { ScoredItem } from "./PriorityScorer";

/**
 * Template tabanlı Türkçe açıklama üretici. LLM kullanılmaz — cümleler
 * skorlama girdilerinden deterministik olarak kurulur.
 */
export class ReasoningTextBuilder {
  build(item: ScoredItem): string {
    const parts: string[] = [];

    const trendText =
      item.sales.trend === "rising"
        ? ", yükselen trendde"
        : item.sales.trend === "falling"
          ? ", düşen trendde"
          : "";
    parts.push(
      `Son 30 günün en çok satan ${item.salesRank}. ürünü (${item.sales.unitsSoldLast30Days} adet${trendText})`,
    );

    if (item.bestStock.isStale) {
      parts.push(`${item.stockAgeDays} gündür bekleyen atıl stoktan üretiliyor`);
    } else if (item.stockAgeDays >= 30) {
      parts.push(`${item.stockAgeDays} günlük stoktan üretiliyor`);
    }

    const scrapText = `tahmini fire %${item.scrapPercent.toFixed(1).replace(/\.0$/, "")}`;

    return `${parts.join(", ")} — ${scrapText}.`;
  }
}
