import { useState } from "react";
import { useStore } from "zustand";
import {
  GuillotineScrapEstimator,
  ProductionPlanBuilder,
  type PartDefinition,
  type ProductionPlan,
  type SalesRecord,
} from "@metalnest/core";
import { simStore } from "../sim/simStore";
import { diffPlans, injectRushOrder, type PlanDiff } from "../whatif/whatIfMath";
import { computeSmartBatches, type MaterialBatch } from "../whatif/smartBatch";

const QTY_PRESETS = [20, 50, 100] as const;

interface Scenario {
  part: PartDefinition;
  qty: number;
  newPlan: ProductionPlan;
  newSales: SalesRecord[];
  diff: PlanDiff;
}

/** Eski → yeni metrik satırı. `goodWhenDown`: değer düşünce yeşil. */
function DiffRow({
  label,
  oldV,
  newV,
  unit,
  goodWhenDown,
}: {
  label: string;
  oldV: number | string;
  newV: number | string;
  unit?: string;
  goodWhenDown?: boolean;
}) {
  const changed = oldV !== newV;
  const numeric = typeof oldV === "number" && typeof newV === "number";
  const improved = numeric && (goodWhenDown ? newV < oldV : newV > oldV);
  return (
    <div className="flex items-center justify-between py-1.5 text-[12px]">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono">
        <span className="text-slate-500">
          {oldV}
          {unit}
        </span>
        <span className="mx-2 text-slate-600">→</span>
        <span className={changed ? (improved ? "font-bold text-emerald-400" : "font-bold text-amber-400") : "text-slate-300"}>
          {newV}
          {unit}
        </span>
      </span>
    </div>
  );
}

/** What-If Senaryo Sandbox'ı: acil siparişi kuyruğa sürükle-bırak →
 * GERÇEK Karar Motoru yeniden planlar → fark paneli ₺ etkisiyle gösterilir.
 * Uygula = canlı kuyruk değişir; Vazgeç = hiçbir iz kalmaz. */
export function WhatIfHUD() {
  const planInputs = useStore(simStore, (s) => s.planInputs);
  const plan = useStore(simStore, (s) => s.plan);
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<number>(50);
  const [dragSku, setDragSku] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [batches, setBatches] = useState<MaterialBatch[] | null>(null);

  if (!planInputs || !plan) return null;

  const runSmartBatch = () => {
    // Talep = plandaki önerilen adetler; levha 1200×2500 (mock stok standardı)
    const demand = Object.fromEntries(
      plan.recommendations.map((r) => [r.sku, Math.min(r.recommendedQuantity, 12)]),
    );
    setBatches(computeSmartBatches(planInputs.parts, demand, 1200, 2500, 5));
    console.log("[BATCH] Akıllı gruplama hesaplandı");
  };

  const runScenario = (part: PartDefinition, rushQty: number) => {
    const newSales = injectRushOrder(planInputs.sales, part, rushQty);
    const newPlan = new ProductionPlanBuilder(new GuillotineScrapEstimator()).build({
      parts: planInputs.parts,
      stock: planInputs.stock,
      sales: newSales,
      weights: planInputs.weights,
    });
    const partsRecord = Object.fromEntries(planInputs.parts.map((p) => [p.sku, p]));
    setScenario({
      part,
      qty: rushQty,
      newPlan,
      newSales,
      diff: diffPlans(plan, newPlan, partsRecord, part.sku),
    });
    setDragSku(null);
  };

  const apply = () => {
    if (!scenario) return;
    const partsRecord = Object.fromEntries(planInputs.parts.map((p) => [p.sku, p]));
    simStore.getState().setPlan(scenario.newPlan, partsRecord);
    simStore.getState().setPlanInputs({ ...planInputs, sales: scenario.newSales });
    console.log(
      `[WHATIF] Acil sipariş uygulandı: ${scenario.part.sku} ×${scenario.qty} — plan yeniden düzenlendi.`,
    );
    setScenario(null);
    setOpen(false);
  };

  return (
    <>
      {/* Anahtar buton */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`pointer-events-auto absolute right-6 top-[304px] z-30 flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur-md transition-all active:scale-95 ${
          open
            ? "border-violet-400/60 bg-violet-500/20 text-violet-200 shadow-lg shadow-violet-500/25"
            : "border-white/10 bg-black/55 text-neutral-200 hover:bg-white/10"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v5.2L4.7 17a2 2 0 001.8 3h11a2 2 0 001.8-3L14 8.2V3" />
        </svg>
        Senaryo
      </button>

      {/* Ürün paleti — buton kolonunun SOLUNDA açılır (Tesis butonuyla
          çakışmaz), kısa ekranlarda kendi içinde kaydırılır */}
      {open && !scenario && (
        <div className="pointer-events-auto absolute right-[196px] top-[240px] z-40 max-h-[calc(100vh-280px)] w-80 overflow-y-auto rounded-2xl border border-violet-400/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-1 text-[10px] font-bold tracking-[0.25em] text-violet-300">
            ACİL SİPARİŞ SENARYOSU
          </div>
          <div className="mb-3 text-[11px] text-slate-400">
            Ürünü <span className="text-slate-200">kuyruğa sürükle</span> (veya tıkla) — Karar
            Motoru gerçek verilerle yeniden planlar.
          </div>
          <button
            onClick={runSmartBatch}
            className="mb-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-95"
          >
            ⚡ Akıllı Grupla — çok-SKU levha optimizasyonu
          </button>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Adet:</span>
            {QTY_PRESETS.map((q) => (
              <button
                key={q}
                onClick={() => setQty(q)}
                className={`rounded-lg px-3 py-1 font-mono text-xs transition-colors ${
                  qty === q ? "bg-violet-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {planInputs.parts.map((p) => (
              <div
                key={p.sku}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", p.sku);
                  setDragSku(p.sku);
                }}
                onDragEnd={() => setDragSku(null)}
                onClick={() => runScenario(p, qty)}
                className="cursor-grab rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-violet-400/50 hover:bg-violet-500/10 active:cursor-grabbing"
              >
                <div className="text-[12px] font-semibold text-slate-100">{p.productName}</div>
                <div className="font-mono text-[10px] text-slate-500">
                  {p.sku} · {p.partDimensions.width}×{p.partDimensions.length}mm · {p.materialType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sürüklerken kuyruk üzerinde beliren bırakma alanı */}
      {dragSku && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const sku = e.dataTransfer.getData("text/plain");
            const part = planInputs.parts.find((p) => p.sku === sku);
            if (part) runScenario(part, qty);
          }}
          className="pointer-events-auto absolute left-6 top-24 z-40 flex h-72 w-[360px] items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/70 bg-violet-500/15 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="text-2xl">📥</div>
            <div className="mt-1 text-sm font-bold text-violet-200">Kuyruğa Bırak</div>
            <div className="text-[11px] text-violet-300/80">Karar Motoru yeniden planlayacak</div>
          </div>
        </div>
      )}

      {/* Akıllı gruplama sonucu */}
      {batches && (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-slate-950/95 to-emerald-950/85 p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-2xl">
          <div className="mb-1 text-[10px] font-bold tracking-[0.25em] text-emerald-300">
            AKILLI GRUPLAMA — GUILLOTINE ÇOK-SKU NESTING
          </div>
          <div className="mb-4 text-sm text-slate-300">
            Aynı malzemedeki siparişler ortak levhalara paketlendi:
          </div>
          <div className="space-y-2">
            {batches.map((b) => (
              <div key={b.material} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white">{b.material}</span>
                  <span className="font-mono text-[10px] text-slate-400">{b.sheets.length} levha</span>
                </div>
                <div className="mt-1 font-mono text-[11px]">
                  <span className="text-slate-400">Fire: </span>
                  <span className="text-red-400 line-through">%{b.naiveScrapPct}</span>
                  <span className="mx-1.5 text-slate-500">→</span>
                  <span className="font-bold text-emerald-400">%{b.avgScrapPct}</span>
                  {b.naiveScrapPct > b.avgScrapPct && (
                    <span className="ml-2 font-bold text-emerald-300">
                      −{Math.round((b.naiveScrapPct - b.avgScrapPct) * 10) / 10} puan
                    </span>
                  )}
                </div>
                {/* İlk levhanın mini yerleşimi */}
                {b.sheets[0] && (
                  <svg width={200} height={56} className="mt-2 rounded border border-white/10 bg-slate-950">
                    {b.sheets[0].placements.map((p, i) => (
                      <rect
                        key={i}
                        x={(p.y / 2500) * 200}
                        y={(p.x / 1200) * 56}
                        width={(p.l / 2500) * 200}
                        height={(p.w / 1200) * 56}
                        fill="rgba(56,189,248,0.25)"
                        stroke="#38bdf8"
                        strokeWidth={1}
                      />
                    ))}
                  </svg>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setBatches(null)}
            className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 active:scale-95"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Fark paneli */}
      {scenario && (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-400/40 bg-gradient-to-br from-slate-950/95 to-violet-950/85 p-6 shadow-[0_0_50px_rgba(139,92,246,0.3)] backdrop-blur-2xl">
          <div className="mb-1 text-[10px] font-bold tracking-[0.25em] text-violet-300">
            SENARYO SONUCU — KARAR MOTORU
          </div>
          <div className="mb-4 text-lg font-bold text-white">
            {scenario.part.productName} <span className="font-mono text-violet-300">×{scenario.qty} acil</span>
          </div>
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/30 px-4 py-1">
            <DiffRow
              label="Kuyruk sırası"
              oldV={scenario.diff.rushRankOld === 0 ? "planda yok" : `#${scenario.diff.rushRankOld}`}
              newV={scenario.diff.rushRankNew === 0 ? "planda yok" : `#${scenario.diff.rushRankNew}`}
            />
            <DiffRow label="Filo fire" oldV={scenario.diff.scrapOldPct} newV={scenario.diff.scrapNewPct} unit="%" goodWhenDown />
            <DiffRow label="İş sayısı" oldV={scenario.diff.jobsOld} newV={scenario.diff.jobsNew} />
            <DiffRow label="Tahmini süre" oldV={scenario.diff.makespanOldMin} newV={scenario.diff.makespanNewMin} unit=" dk" goodWhenDown />
          </div>
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-center ${
              scenario.diff.moneyDeltaTL >= 0
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-red-400/40 bg-red-500/10"
            }`}
          >
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              {scenario.diff.moneyDeltaTL >= 0 ? "Tahmini fire tasarrufu" : "Tahmini ek fire maliyeti"}
            </div>
            <div
              className={`font-mono text-2xl font-bold ${
                scenario.diff.moneyDeltaTL >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              ₺{Math.abs(scenario.diff.moneyDeltaTL).toLocaleString("tr-TR")}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={apply}
              className="flex-1 rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:bg-violet-400 active:scale-95"
            >
              Planı Uygula
            </button>
            <button
              onClick={() => setScenario(null)}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 active:scale-95"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </>
  );
}
