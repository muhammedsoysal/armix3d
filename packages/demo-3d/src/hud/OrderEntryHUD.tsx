import { useState } from "react";
import { useStore } from "zustand";
import { GuillotineScrapEstimator, ProductionPlanBuilder } from "@metalnest/core";
import { simStore } from "../sim/simStore";
import { injectRushOrder } from "../whatif/whatIfMath";
import { uiStore } from "./uiStore";

const QTY_PRESETS = [10, 25, 50, 100] as const;

interface Submitted {
  productName: string;
  qty: number;
  dueDate: string;
  /** Yeni plandaki kuyruk sırası (1 tabanlı, 0 = planda yok) */
  rank: number;
  gatewayState: "sent" | "offline" | "skipped";
}

/** Sipariş Girişi — cam panel form: Ürün + Adet + Termin. Gönderince
 * (1) gateway'e POST edilir (varsa; yoksa offline-kiosk sessizce geçer),
 * (2) GERÇEK Karar Motoru satış verisine işlenmiş siparişle CANLI yeniden
 * planlar — kuyruk gözünün önünde yeniden sıralanır. */
export function OrderEntryHUD() {
  const open = useStore(uiStore, (s) => s.openPanel === "order");
  const planInputs = useStore(simStore, (s) => s.planInputs);
  const [sku, setSku] = useState<string | null>(null);
  const [qty, setQty] = useState(25);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [done, setDone] = useState<Submitted | null>(null);

  if (!open || !planInputs) return null;
  const part = planInputs.parts.find((p) => p.sku === sku) ?? planInputs.parts[0];

  const submit = () => {
    // 1) Gateway'e ilet — fire-and-forget; ağ yoksa kiosk kuralı gereği sorun değil
    const api = import.meta.env.VITE_API_URL as string | undefined;
    let gatewayState: Submitted["gatewayState"] = "skipped";
    if (api) {
      gatewayState = "sent";
      fetch(`${api}/api/v1/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sku: part.sku, qty, dueDate }),
      }).catch(() => console.log("[SİPARİŞ] Gateway erişilemez — yerel motor devam ediyor"));
    }

    // 2) Karar Motoru canlı yeniden planlar (What-If ile aynı gerçek motor)
    const newSales = injectRushOrder(planInputs.sales, part, qty);
    const newPlan = new ProductionPlanBuilder(new GuillotineScrapEstimator()).build({
      parts: planInputs.parts,
      stock: planInputs.stock,
      sales: newSales,
      weights: planInputs.weights,
    });
    const partsRecord = Object.fromEntries(planInputs.parts.map((p) => [p.sku, p]));
    simStore.getState().setPlan(newPlan, partsRecord);
    simStore.getState().setPlanInputs({ ...planInputs, sales: newSales });
    const rank = newPlan.recommendations.findIndex((r) => r.sku === part.sku) + 1;
    console.log(`[SİPARİŞ] ${part.sku} ×${qty} (termin ${dueDate}) — plan yeniden düzenlendi, sıra #${rank}`);
    setDone({ productName: part.productName, qty, dueDate, rank, gatewayState });
  };

  return (
    <div className="pointer-events-auto absolute right-16 top-1/2 z-40 max-h-[80vh] w-80 -translate-y-1/2 overflow-y-auto rounded-2xl border border-cyan-400/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-1 text-[10px] font-bold tracking-[0.25em] text-cyan-300">SİPARİŞ GİRİŞİ</div>

      {done ? (
        <div className="animate-in fade-in duration-300">
          <div className="mt-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Sipariş kuyruğa işlendi</div>
            <div className="mt-1 text-sm font-bold text-white">{done.productName}</div>
            <div className="font-mono text-[11px] tabular-nums text-slate-400">
              ×{done.qty} · termin {done.dueDate}
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
              {done.rank > 0 ? `Kuyruk #${done.rank}` : "Sonraki döngüde"}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              {done.gatewayState === "sent" ? "ERP gateway'e iletildi · motor yeniden planladı" : "Karar Motoru canlı yeniden planladı"}
            </div>
          </div>
          <button
            onClick={() => setDone(null)}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 active:scale-95"
          >
            Yeni Sipariş
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 text-[11px] text-slate-400">
            Yeni siparişi gir — <span className="text-slate-200">Karar Motoru</span> kuyruğu canlı yeniden planlar.
          </div>

          <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Ürün</label>
          <div className="mb-3 space-y-1.5">
            {planInputs.parts.map((p) => (
              <button
                key={p.sku}
                onClick={() => setSku(p.sku)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                  part.sku === p.sku
                    ? "border-cyan-400/60 bg-cyan-500/15"
                    : "border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10"
                }`}
              >
                <div className="text-[12px] font-semibold text-slate-100">{p.productName}</div>
                <div className="font-mono text-[10px] tabular-nums text-slate-500">
                  {p.sku} · {p.partDimensions.width}×{p.partDimensions.length}mm
                </div>
              </button>
            ))}
          </div>

          <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Adet</label>
          <div className="mb-3 flex items-center gap-2">
            {QTY_PRESETS.map((q) => (
              <button
                key={q}
                onClick={() => setQty(q)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs tabular-nums transition-colors ${
                  qty === q ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-right font-mono text-xs tabular-nums text-white outline-none focus:border-cyan-400/60"
            />
          </div>

          <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Termin</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs tabular-nums text-white outline-none [color-scheme:dark] focus:border-cyan-400/60"
          />

          <button
            onClick={submit}
            className="w-full rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-95"
          >
            Siparişi Gönder → Yeniden Planla
          </button>
        </>
      )}
    </div>
  );
}
