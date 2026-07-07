import { describe, expect, it } from "vitest";
import { naiveTrimPct, planSlitting } from "../SlitOptimizer";

describe("planSlitting (1D cutting stock)", () => {
  it("finds a zero-trim perfect combination", () => {
    // 1200 = 400 + 400 + 400 (kerf 0)
    const plan = planSlitting([{ widthMm: 400, qty: 6 }], 1200, 0);
    expect(plan.patterns[0].trimMm).toBe(0);
    expect(plan.totalTrimPct).toBe(0);
  });

  it("mixes widths to beat single-width patterns", () => {
    // 1250, kerf 5: 700+500 birlikte → trim 45; tek-genişlik desenler
    // (700: trim 545 · 500×2: trim 245) çok daha kötü
    const orders = [
      { widthMm: 700, qty: 4 },
      { widthMm: 500, qty: 4 },
    ];
    const plan = planSlitting(orders, 1250, 5);
    const naive = naiveTrimPct(orders, 1250, 5);
    expect(plan.totalTrimPct).toBeLessThan(naive);
    expect(plan.totalTrimPct).toBeLessThan(5);
  });

  it("is NEVER worse than the naive single-width baseline (demo order book)", () => {
    // Bu defterde tek-genişlik desenler neredeyse mükemmel — açgözlü
    // karıştırıcının kaybettiği gerçek vaka (regresyon testi)
    const orders = [
      { widthMm: 244, qty: 20 },
      { widthMm: 410, qty: 12 },
      { widthMm: 203, qty: 18 },
      { widthMm: 245, qty: 16 },
    ];
    const plan = planSlitting(orders, 1250, 5);
    expect(plan.totalTrimPct).toBeLessThanOrEqual(naiveTrimPct(orders, 1250, 5));
  });

  it("satisfies all demand", () => {
    const orders = [
      { widthMm: 244, qty: 20 },
      { widthMm: 410, qty: 12 },
      { widthMm: 203, qty: 18 },
    ];
    const plan = planSlitting(orders, 1250, 5);
    const produced: Record<number, number> = {};
    for (const p of plan.patterns) {
      for (const w of p.widths) produced[w] = (produced[w] ?? 0) + p.runs;
    }
    for (const o of orders) {
      expect(produced[o.widthMm] ?? 0).toBeGreaterThanOrEqual(o.qty);
    }
  });
});
