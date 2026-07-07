import type { SalesRecord } from "../models";

/**
 * Talep tahmini — Holt çift üstel düzeltme (seviye + trend).
 * Elimizde ham zaman serisi yok (ERP entegrasyonunda gelecek); 30/90 günlük
 * toplamlardan 12 haftalık yaklaşık seri türetilir: ilk 8 hafta eski tempo
 * ((90g−30g)/60·7), son 4 hafta güncel tempo (30g/30·7). Deterministiktir.
 */

export interface DemandForecast {
  /** Haftalık tahmini talep (adet) */
  weeklyDemand: number;
  /** Haftalık trend (adet/hafta; + = yükseliş) */
  trendPerWeek: number;
  /** %90 güven aralığı yarı genişliği (adet) — artık std sapmasından */
  ci90: number;
}

export function weeklySeriesFrom(sales: SalesRecord): number[] {
  const oldRate = Math.max(0, ((sales.unitsSoldLast90Days - sales.unitsSoldLast30Days) / 60) * 7);
  const newRate = (sales.unitsSoldLast30Days / 30) * 7;
  return [...Array(8).fill(oldRate), ...Array(4).fill(newRate)];
}

/** Holt (1957) çift üstel düzeltme; α=0.4, β=0.3 (kısa seriler için standart). */
export function holtForecast(series: number[], alpha = 0.4, beta = 0.3): DemandForecast {
  if (series.length < 2) {
    const v = series[0] ?? 0;
    return { weeklyDemand: Math.round(v), trendPerWeek: 0, ci90: 0 };
  }
  let level = series[0];
  let trend = series[1] - series[0];
  const residuals: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const forecast = level + trend;
    residuals.push(series[i] - forecast);
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const mean = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const variance = residuals.reduce((s, r) => s + (r - mean) ** 2, 0) / residuals.length;
  return {
    weeklyDemand: Math.max(0, Math.round(level + trend)),
    trendPerWeek: Math.round(trend * 10) / 10,
    ci90: Math.round(1.645 * Math.sqrt(variance) * 10) / 10,
  };
}

export function forecastFromSales(sales: SalesRecord): DemandForecast {
  return holtForecast(weeklySeriesFrom(sales));
}

/** Reasoning metnine eklenecek Türkçe tahmin cümlesi. */
export function forecastSentence(f: DemandForecast): string {
  const dir = f.trendPerWeek > 0.5 ? "yükselen" : f.trendPerWeek < -0.5 ? "düşen" : "yatay";
  return ` Holt tahmini: ~${f.weeklyDemand} adet/hafta, ${dir} trend (${f.trendPerWeek >= 0 ? "+" : ""}${f.trendPerWeek}/hafta, %90 GA ±${f.ci90}).`;
}
