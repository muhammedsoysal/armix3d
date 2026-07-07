/**
 * Yarma hattı trim optimizasyonu — klasik 1D Cutting Stock Problem.
 * Genişlik çeşidi az olduğundan (tipik 5-15) tam desen sayımı (DFS) +
 * açgözlü desen seçimi yeterli: her turda kalan talebi karşılayan,
 * trim'i minimum desen seçilir ve mümkün olan en çok tekrar koşulur.
 * Gilmore-Gomory column generation'ın pratik, deterministik küçük kardeşi.
 */

export interface SlitOrder {
  widthMm: number;
  qty: number; // istenen şerit (mult) adedi
}

export interface SlitPatternPlan {
  /** Desendeki şerit genişlikleri (ör. [700, 500]) */
  widths: number[];
  /** Bu desen kaç ana rulodan koşulacak */
  runs: number;
  trimMm: number;
}

export interface SlitPlan {
  patterns: SlitPatternPlan[];
  /** Toplam trim / toplam kullanılan rulo genişliği (%) */
  totalTrimPct: number;
}

/** Kalan talebi aşmadan sığan tüm desenleri DFS ile üret, en az trim'i döndür. */
function bestPattern(
  widths: number[],
  remaining: Map<number, number>,
  coilW: number,
  kerf: number,
): number[] | null {
  let best: { widths: number[]; used: number } | null = null;
  const current: number[] = [];

  const dfs = (startIdx: number, used: number) => {
    if (current.length > 0 && (!best || used > best.used)) {
      best = { widths: [...current], used };
    }
    for (let i = startIdx; i < widths.length; i++) {
      const w = widths[i];
      const usedOfW = current.filter((x) => x === w).length;
      if (usedOfW >= (remaining.get(w) ?? 0)) continue;
      const add = w + (current.length > 0 ? kerf : 0);
      if (used + add > coilW) continue;
      current.push(w);
      dfs(i, used + add);
      current.pop();
    }
  };
  dfs(0, 0);
  return best ? (best as { widths: number[] }).widths : null;
}

export function planSlitting(orders: SlitOrder[], coilWmm: number, kerfMm: number): SlitPlan {
  // İki aday plan: karışık-açgözlü + naif tek-genişlik. Açgözlü karıştırma,
  // düzgün bölünen sipariş defterlerinde kuyruk artıkları yüzünden
  // KAYBEDEBİLİR — düşüğü seçerek "asla naif'ten kötü değil" garanti edilir.
  const mixed = planMixedGreedy(orders, coilWmm, kerfMm);
  const naive = planNaive(orders, coilWmm, kerfMm);
  return mixed.totalTrimPct <= naive.totalTrimPct ? mixed : naive;
}

function planNaive(orders: SlitOrder[], coilWmm: number, kerfMm: number): SlitPlan {
  const patterns: SlitPatternPlan[] = [];
  for (const o of orders) {
    const perCoil = Math.max(1, Math.floor((coilWmm + kerfMm) / (o.widthMm + kerfMm)));
    let left = o.qty;
    while (left > 0) {
      const n = Math.min(perCoil, left);
      const used = n * o.widthMm + kerfMm * (n - 1);
      patterns.push({ widths: Array(n).fill(o.widthMm), runs: 1, trimMm: coilWmm - used });
      left -= n;
    }
  }
  const totalTrim = patterns.reduce((s, p) => s + p.trimMm * p.runs, 0);
  const total = patterns.reduce((s, p) => s + coilWmm * p.runs, 0);
  return { patterns, totalTrimPct: total > 0 ? Math.round((totalTrim / total) * 1000) / 10 : 0 };
}

function planMixedGreedy(orders: SlitOrder[], coilWmm: number, kerfMm: number): SlitPlan {
  const widths = [...new Set(orders.map((o) => o.widthMm))].sort((a, b) => b - a);
  const remaining = new Map(orders.map((o) => [o.widthMm, o.qty]));
  const patterns: SlitPatternPlan[] = [];

  while ([...remaining.values()].some((q) => q > 0)) {
    const pat = bestPattern(widths, remaining, coilWmm, kerfMm);
    if (!pat || pat.length === 0) break; // hiçbir şerit sığmıyor
    // Bu desen, içindeki en kısıtlı genişlik tükenene kadar koşulur
    const counts = new Map<number, number>();
    for (const w of pat) counts.set(w, (counts.get(w) ?? 0) + 1);
    let runs = Infinity;
    for (const [w, c] of counts) runs = Math.min(runs, Math.floor((remaining.get(w) ?? 0) / c));
    runs = Math.max(1, runs);
    for (const [w, c] of counts) remaining.set(w, Math.max(0, (remaining.get(w) ?? 0) - c * runs));
    const used = pat.reduce((s, w) => s + w, 0) + kerfMm * (pat.length - 1);
    patterns.push({ widths: pat, runs, trimMm: coilWmm - used });
  }

  const totalTrim = patterns.reduce((s, p) => s + p.trimMm * p.runs, 0);
  const totalWidth = patterns.reduce((s) => s + coilWmm, 0) * 0 +
    patterns.reduce((s, p) => s + coilWmm * p.runs, 0);
  return {
    patterns,
    totalTrimPct: totalWidth > 0 ? Math.round((totalTrim / totalWidth) * 1000) / 10 : 0,
  };
}

/** Naif taban çizgisi: her genişlik KENDİ deseninde (tek-genişlik) dilinir.
 * planNaive ile birebir aynı hesap — son rulonun eksik dolumu dahil (dürüst). */
export function naiveTrimPct(orders: SlitOrder[], coilWmm: number, kerfMm: number): number {
  return planNaive(orders, coilWmm, kerfMm).totalTrimPct;
}
