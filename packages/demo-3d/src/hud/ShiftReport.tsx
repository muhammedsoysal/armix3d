import { useStore } from "zustand";
import { simStore } from "../sim/simStore";
import { scrapStore } from "../nesting/scrapStore";
import { truckStore } from "../truck/truckStore";
import { SLIT_TRIM_PROOF, telemetryStore } from "../telemetry/telemetryStore";
import { uiStore } from "./uiStore";

/** Vardiya Sonu Raporu — patronun masasına koyacağı kağıt. window.print()
 * ile yerel "PDF olarak kaydet" kullanılır: sıfır bağımlılık, offline çalışır. */
export function ShiftReport() {
  const open = useStore(uiStore, (s) => s.openPanel === "report");
  const totalPieces = useStore(simStore, (s) => s.totalPiecesCut);
  const pallets = useStore(simStore, (s) => s.completedPallets.length);
  const loaded = useStore(truckStore, (s) => s.loadedIds.length);
  const scrapKg = useStore(scrapStore, (s) => s.scrapKg);
  const scrapTL = useStore(scrapStore, (s) => s.scrapValueTL);
  const machines = useStore(telemetryStore, (s) => s.machines);
  const kwh = Math.round(totalPieces * 1.9 * 10) / 10;
  const co2 = Math.round(kwh * 0.42 * 10) / 10;

  return (
    <>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          {/* Yazdırmada yalnızca rapor görünür */}
          <style>{`@media print { body * { visibility: hidden !important; } #shift-report, #shift-report * { visibility: visible !important; } #shift-report { position: fixed; inset: 0; box-shadow: none !important; } }`}</style>
          <div id="shift-report" className="max-h-[85vh] w-[560px] overflow-y-auto rounded-xl bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <div className="text-lg font-black">VARDİYA SONU ÜRETİM RAPORU</div>
                <div className="text-[11px] text-slate-500">MetalNest Digital Twin · Karar Motoru v2 (Guillotine + 1D-CSP)</div>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-500">
                {new Date().toLocaleDateString("tr-TR")}<br />{new Date().toLocaleTimeString("tr-TR")}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
              {[
                ["Toplam Kesim", `${totalPieces}`, "adet"],
                ["Dolu Palet", `${pallets}`, "palet"],
                ["Sevk Edilen", `${loaded}`, "palet"],
                ["Enerji", `${kwh}`, "kWh"],
              ].map(([k, v, u]) => (
                <div key={k} className="rounded-lg border border-slate-200 bg-slate-50 py-2">
                  <div className="text-xl font-black">{v}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">{k} ({u})</div>
                </div>
              ))}
            </div>

            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider">Fire & Maliyet</div>
            <table className="mb-4 w-full text-[11px]">
              <tbody>
                <tr className="border-b border-slate-200"><td className="py-1 text-slate-500">Fire kütlesi</td><td className="text-right font-mono font-bold">{scrapKg.toFixed(1)} kg</td></tr>
                <tr className="border-b border-slate-200"><td className="py-1 text-slate-500">Kayıp değer (₺85/kg)</td><td className="text-right font-mono font-bold text-red-600">₺{scrapTL.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</td></tr>
                <tr className="border-b border-slate-200"><td className="py-1 text-slate-500">Yarma hattı trim (1D-CSP)</td><td className="text-right font-mono font-bold">%{SLIT_TRIM_PROOF.optimizedPct} <span className="font-normal text-slate-400">(naif %{SLIT_TRIM_PROOF.naivePct})</span></td></tr>
                <tr><td className="py-1 text-slate-500">Karbon ayak izi</td><td className="text-right font-mono font-bold">{co2} kg CO₂</td></tr>
              </tbody>
            </table>

            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider">Makine Performansı (canlı telemetri)</div>
            <table className="mb-5 w-full text-[11px]">
              <thead><tr className="border-b-2 border-slate-300 text-left text-[9px] uppercase text-slate-500"><th className="py-1">Makine</th><th>Durum</th><th className="text-right">OEE</th><th className="text-right">Parça</th></tr></thead>
              <tbody>
                {Object.values(machines).map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-1 font-semibold">{m.name}</td>
                    <td className="text-slate-500">{m.status}</td>
                    <td className="text-right font-mono font-bold">%{Math.round(m.oee)}</td>
                    <td className="text-right font-mono">{m.partsToday}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400">
              <span>Karar Motoru v2 — matematiksel garanti: grid'den ve naif'ten asla kötü değil</span>
              <span className="italic">otomatik oluşturuldu</span>
            </div>

            <div className="mt-5 flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                🖨️ Yazdır / PDF Kaydet
              </button>
              <button onClick={() => uiStore.getState().toggle("report")} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
