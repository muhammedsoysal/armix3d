import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCORER_WEIGHTS,
  HeuristicScrapEstimator,
  ProductionPlanBuilder,
  type PartDefinition,
  type SalesRecord,
  type StockItem,
} from "@metalnest/core";
import { diffPlans, injectRushOrder } from "../whatIfMath";

const NOW = new Date("2026-07-07T09:00:00Z");

const parts: PartDefinition[] = [
  { sku: "P-A", productName: "Panel A", materialType: "304", partDimensions: { width: 400, length: 300 } },
  { sku: "P-B", productName: "Panel B", materialType: "304", partDimensions: { width: 500, length: 800 } },
];
const stock: StockItem[] = [
  {
    sku: "S-1",
    materialType: "304",
    dimensions: { width: 1200, length: 2500, thickness: 1.5 },
    quantityAvailable: 40,
    arrivalDate: new Date("2026-03-01"),
    unitCost: 900,
    isStale: true,
  },
];
const sales: SalesRecord[] = [
  { sku: "P-A", productName: "Panel A", unitsSoldLast30Days: 300, unitsSoldLast90Days: 800, revenueLast30Days: 90000, trend: "rising" },
  { sku: "P-B", productName: "Panel B", unitsSoldLast30Days: 20, unitsSoldLast90Days: 70, revenueLast30Days: 9000, trend: "stable" },
];

describe("injectRushOrder", () => {
  it("boosts an existing record and marks it rising", () => {
    const out = injectRushOrder(sales, parts[1], 100);
    const rec = out.find((s) => s.sku === "P-B")!;
    expect(rec.unitsSoldLast30Days).toBeGreaterThan(20);
    expect(rec.trend).toBe("rising");
    // orijinal dizi mutasyona uğramaz
    expect(sales.find((s) => s.sku === "P-B")!.unitsSoldLast30Days).toBe(20);
  });
  it("creates a record for a SKU with no sales history", () => {
    const noB = sales.filter((s) => s.sku !== "P-B");
    const out = injectRushOrder(noB, parts[1], 50);
    expect(out.find((s) => s.sku === "P-B")).toBeTruthy();
  });
});

describe("end-to-end: rush order improves the SKU's plan rank", () => {
  it("P-B rises after a big rush order", () => {
    const builder = new ProductionPlanBuilder(new HeuristicScrapEstimator());
    const base = { parts, stock, weights: DEFAULT_SCORER_WEIGHTS, now: NOW };
    const oldPlan = builder.build({ ...base, sales });
    const newPlan = builder.build({ ...base, sales: injectRushOrder(sales, parts[1], 400) });
    const rank = (p: typeof oldPlan, sku: string) => p.recommendations.findIndex((r) => r.sku === sku);
    expect(rank(newPlan, "P-B")).toBeLessThan(rank(oldPlan, "P-B"));

    const partsRecord = Object.fromEntries(parts.map((p) => [p.sku, p]));
    const diff = diffPlans(oldPlan, newPlan, partsRecord, "P-B");
    expect(diff.rushRankOld).toBe(2);
    expect(diff.rushRankNew).toBe(1);
    expect(typeof diff.scrapDeltaPct).toBe("number");
    expect(diff.makespanNewMin).toBeGreaterThan(0);
    expect(typeof diff.moneyDeltaTL).toBe("number");
  });
});
