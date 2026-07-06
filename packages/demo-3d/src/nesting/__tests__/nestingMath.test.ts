import { describe, expect, it } from "vitest";
import { computeNest, nestCandidates, scrapKgFor } from "../nestingMath";

// Görsel sac genişliği 1200mm; kerf 5mm (core HeuristicScrapEstimator kuralı)
describe("computeNest", () => {
  it("fits columns across the width with kerf cells", () => {
    // 400mm parça: floor((1200+5)/(400+5)) = 2 sütun... (1205/405=2.97→2)
    const n = computeNest(400, 300, 1200, 300, 5);
    expect(n.cols).toBe(2);
    expect(n.rows).toBe(1);
    expect(n.cells.length).toBe(2);
    expect(n.usedWmm).toBe(800);
    expect(n.trimWmm).toBe(400);
  });
  it("rotates when the rotated orientation fits more", () => {
    // 800×500: normal → floor(1205/805)=1 sütun; döndürülmüş (500 en) → floor(1205/505)=2
    const n = computeNest(800, 500, 1200, 800, 5);
    expect(n.rotated).toBe(true);
    expect(n.cols).toBe(2);
  });
  it("scrapRatio consistent with used area", () => {
    const n = computeNest(400, 300, 1200, 300, 5);
    const used = (2 * 400 * 300) / (1200 * 300);
    expect(n.scrapRatio).toBeCloseTo(1 - used, 5);
  });
});

describe("nestCandidates", () => {
  it("marks exactly one winner and it has the minimum scrap", () => {
    const cands = nestCandidates(800, 600, 1200, 800, 5);
    const winners = cands.filter((c) => c.chosen);
    expect(winners.length).toBe(1);
    const minScrap = Math.min(...cands.map((c) => c.scrapPct));
    expect(winners[0].scrapPct).toBe(minScrap);
  });
});

describe("scrapKgFor", () => {
  it("computes mass of the wasted area", () => {
    // scrapRatio 0.5, alan 1.2m×0.3m, t=2mm, ρ=7900 → 0.5·0.36·0.002·7900 ≈ 2.844 kg
    const kg = scrapKgFor(0.5, 1200, 300, 2);
    expect(kg).toBeCloseTo(2.844, 2);
  });
});
