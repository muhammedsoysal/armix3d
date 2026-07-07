import { describe, expect, it } from "vitest";
import { packGuillotine, GuillotineScrapEstimator } from "../GuillotineNester";
import { HeuristicScrapEstimator } from "../ScrapEstimator";
import type { PartDefinition, StockItem } from "../../models";

const KERF = 5;

describe("packGuillotine", () => {
  it("packs a perfect fit with zero waste (kerf'siz)", () => {
    const r = packGuillotine([{ id: "a", w: 500, l: 500, qty: 4 }], 1000, 1000, 0);
    expect(r.placements.length).toBe(4);
    expect(r.utilization).toBeCloseTo(1, 5);
  });

  it("never overlaps and never exceeds sheet bounds", () => {
    const r = packGuillotine(
      [
        { id: "a", w: 400, l: 300, qty: 5 },
        { id: "b", w: 95, l: 145, qty: 12 },
      ],
      1200,
      2000,
      KERF,
    );
    for (const p of r.placements) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(1200 + 1e-6);
      expect(p.y + p.l).toBeLessThanOrEqual(2000 + 1e-6);
    }
    for (let i = 0; i < r.placements.length; i++) {
      for (let j = i + 1; j < r.placements.length; j++) {
        const a = r.placements[i];
        const b = r.placements[j];
        const overlap =
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.l && b.y < a.y + a.l;
        expect(overlap).toBe(false);
      }
    }
  });

  it("mixes SKUs: small parts fill the leftover of big parts", () => {
    // 1200×1000 levha: 1 büyük 800×900 parça → sağda 400'lük şerit kalır;
    // 350×280 küçükler o şeride girmeli (tek başına büyük parça %60 doluluk)
    const r = packGuillotine(
      [
        { id: "big", w: 800, l: 900, qty: 1 },
        { id: "small", w: 350, l: 280, qty: 3 },
      ],
      1200,
      1000,
      KERF,
    );
    const smalls = r.placements.filter((p) => p.id === "small");
    expect(smalls.length).toBeGreaterThanOrEqual(2);
    expect(r.utilization).toBeGreaterThan(0.75);
  });

  it("uses rotation when it fits more", () => {
    // 1200 genişliğe 700×500: dikte 1, döndürülünce (500 en) 2 sütun
    const r = packGuillotine([{ id: "a", w: 700, l: 500, qty: 2 }], 1200, 700, 0);
    expect(r.placements.length).toBe(2);
  });
});

describe("GuillotineScrapEstimator vs Heuristic grid", () => {
  const stock: StockItem = {
    sku: "S",
    materialType: "304",
    dimensions: { width: 1200, length: 2500, thickness: 1.5 },
    quantityAvailable: 10,
    arrivalDate: new Date("2026-01-01"),
    unitCost: 900,
  };
  const part: PartDefinition = {
    sku: "P",
    productName: "P",
    materialType: "304",
    partDimensions: { width: 700, length: 500 },
  };

  it("is never worse than the grid heuristic", () => {
    const grid = new HeuristicScrapEstimator();
    const guillotine = new GuillotineScrapEstimator();
    expect(guillotine.partsPerSheet(part, stock)).toBeGreaterThanOrEqual(
      grid.partsPerSheet(part, stock),
    );
    expect(guillotine.estimateScrapPercent(part, stock)).toBeLessThanOrEqual(
      grid.estimateScrapPercent(part, stock),
    );
  });
});
