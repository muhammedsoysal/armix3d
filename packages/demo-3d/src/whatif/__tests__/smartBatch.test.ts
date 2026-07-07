import { describe, expect, it } from "vitest";
import type { PartDefinition } from "@metalnest/core";
import { computeSmartBatches } from "../smartBatch";

const parts: PartDefinition[] = [
  { sku: "BIG", productName: "Büyük Panel", materialType: "304", partDimensions: { width: 800, length: 900 } },
  { sku: "SML", productName: "Küçük Flanş", materialType: "304", partDimensions: { width: 350, length: 280 } },
  { sku: "OTH", productName: "316 Parça", materialType: "316L", partDimensions: { width: 400, length: 400 } },
];

describe("computeSmartBatches", () => {
  it("groups by material and never mixes incompatible materials", () => {
    const batches = computeSmartBatches(parts, { BIG: 2, SML: 6, OTH: 3 }, 1200, 1000, 5);
    expect(batches.length).toBe(2);
    const m304 = batches.find((b) => b.material === "304")!;
    const skus = new Set(m304.sheets.flatMap((s) => s.placements.map((p) => p.id)));
    expect(skus.has("OTH")).toBe(false);
  });

  it("mixed batching beats one-SKU-per-sheet baseline", () => {
    const batches = computeSmartBatches(parts, { BIG: 2, SML: 6 }, 1200, 1000, 5);
    const b = batches.find((x) => x.material === "304")!;
    expect(b.avgScrapPct).toBeLessThan(b.naiveScrapPct);
    // Tüm talep yerleşti
    const placed: Record<string, number> = {};
    for (const s of b.sheets) for (const p of s.placements) placed[p.id] = (placed[p.id] ?? 0) + 1;
    expect(placed.BIG).toBe(2);
    expect(placed.SML).toBe(6);
  });
});
