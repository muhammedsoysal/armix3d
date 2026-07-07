import { describe, expect, it } from "vitest";
import { forecastFromSales, holtForecast } from "../Forecast";

describe("holtForecast", () => {
  it("detects a rising trend", () => {
    const f = holtForecast([10, 12, 14, 16, 18, 20, 22, 24]);
    expect(f.trendPerWeek).toBeGreaterThan(1);
    expect(f.weeklyDemand).toBeGreaterThan(24);
  });
  it("flat series → near-zero trend, tight CI", () => {
    const f = holtForecast([50, 50, 50, 50, 50, 50]);
    expect(Math.abs(f.trendPerWeek)).toBeLessThan(0.5);
    expect(f.ci90).toBeLessThan(1);
  });
  it("sales aggregates: recent acceleration produces positive trend", () => {
    // 90g=300, 30g=200 → eski tempo ~11.7/hafta, yeni ~46.7 → yükseliş
    const f = forecastFromSales({
      sku: "X",
      productName: "X",
      unitsSoldLast30Days: 200,
      unitsSoldLast90Days: 300,
      revenueLast30Days: 0,
      trend: "rising",
    });
    expect(f.trendPerWeek).toBeGreaterThan(0);
    expect(f.ci90).toBeGreaterThan(0);
  });
});
