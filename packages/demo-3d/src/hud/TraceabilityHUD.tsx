import { useState } from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { simStore } from "../sim/simStore";

/** Seçili palet — Pallet.tsx tıklamada yazar, panel buradan okur. */
export const traceStore = createStore<{ palletId: number | null }>()(() => ({ palletId: null }));
export const selectPallet = (palletId: number | null) => traceStore.setState({ palletId });

/** Palet id'sinden (epoch ms) deterministik soy ağacı üret — ERP entegrasyonunda
 * bu fonksiyonun yerini gerçek MES kaydı alır, panel değişmez. */
function genealogyOf(palletId: number, stackLen: number) {
  const d = new Date(palletId);
  const heat = `H-26${(palletId % 900) + 100}`;
  return {
    heat,
    coilId: `STK-304BA-15A / Bobin ${heat}-C${(palletId % 3) + 1}`,
    supplier: "Acerinox Europa — EN 10204 3.1 sertifikalı",
    machine: "CTL-1 · Boy Kesme Hattı 1",
    operator: `OP-${(palletId % 90) + 110} · Vardiya A`,
    start: new Date(palletId - stackLen * 12400).toLocaleTimeString("tr-TR"),
    end: d.toLocaleTimeString("tr-TR"),
    date: d.toLocaleDateString("tr-TR"),
    banding: "BND-1 · çember + QR",
  };
}

const CHEM = [
  ["C", "0.041"], ["Si", "0.38"], ["Mn", "1.42"], ["P", "0.031"],
  ["S", "0.002"], ["Cr", "18.14"], ["Ni", "8.06"], ["N", "0.046"],
];

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1.5 text-[11px]">
      <span className="text-slate-400">{k}</span>
      <span className="font-mono font-semibold text-slate-100">{v}</span>
    </div>
  );
}

/** Sipariş→Sevkiyat izlenebilirliği: 3D sahnede palete tıkla → tam soy ağacı
 * + EN 10204 3.1 sertifika önizlemesi. Çelik ticaretinin güven belgesi. */
export function TraceabilityHUD() {
  const palletId = useStore(traceStore, (s) => s.palletId);
  const completedPallets = useStore(simStore, (s) => s.completedPallets);
  const [showCert, setShowCert] = useState(false);
  if (!palletId) return null;
  const cp = completedPallets.find((p) => p.id === palletId);
  if (!cp) return null;
  const g = genealogyOf(cp.id, cp.stack.length);

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 z-50 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-slate-950/95 to-amber-950/70 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-2xl">
      <button
        onClick={() => { setShowCert(false); selectPallet(null); }}
        aria-label="Kapat"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-neutral-300 hover:bg-white/15"
      >✕</button>

      {!showCert ? (
        <>
          <div className="mb-1 text-[10px] font-bold tracking-[0.25em] text-amber-300">
            İZLENEBİLİRLİK — PALET SOY AĞACI
          </div>
          <div className="mb-4 font-mono text-lg font-bold text-white">
            PLT-{String(cp.id).slice(-6)} <span className="text-sm text-slate-400">· {cp.stack.length} parça</span>
          </div>
          <Row k="Döküm No (Heat)" v={g.heat} />
          <Row k="Kaynak Rulo" v={g.coilId} />
          <Row k="Tedarikçi" v={g.supplier} />
          <Row k="İşleyen Makine" v={g.machine} />
          <Row k="Operatör" v={g.operator} />
          <Row k="Üretim" v={`${g.date} · ${g.start} → ${g.end}`} />
          <Row k="Paketleme" v={g.banding} />
          <Row k="İçerik" v={[...new Set(cp.stack.map((s) => s.sku))].join(", ")} />
          <button
            onClick={() => setShowCert(true)}
            className="mt-5 w-full rounded-xl border border-amber-400/50 bg-amber-500/15 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/25 active:scale-95"
          >
            📜 EN 10204 3.1 Sertifikayı Görüntüle
          </button>
        </>
      ) : (
        <>
          {/* Sertifika mockup'ı — beyaz "kağıt" görünümü */}
          <div className="rounded-lg bg-slate-100 p-4 text-slate-900">
            <div className="mb-1 flex justify-between border-b-2 border-slate-800 pb-2">
              <div>
                <div className="text-[13px] font-black">MUAYENE SERTİFİKASI</div>
                <div className="text-[9px] text-slate-600">Inspection Certificate — EN 10204 — 3.1</div>
              </div>
              <div className="text-right font-mono text-[9px] text-slate-600">
                Sert. No: {g.heat}-31<br />{g.date}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 py-2 font-mono text-[9px]">
              <div>Döküm: <b>{g.heat}</b></div>
              <div>Kalite: <b>1.4301 / AISI 304</b></div>
              <div>Kalınlık: <b>1.50 mm</b></div>
              <div>Yüzey: <b>2B/BA</b></div>
            </div>
            <div className="mb-1 text-[9px] font-bold">Kimyasal Analiz (%)</div>
            <table className="w-full border border-slate-300 font-mono text-[8px]">
              <tbody>
                <tr>{CHEM.map(([e]) => <td key={e} className="border border-slate-300 bg-slate-200 px-1 text-center font-bold">{e}</td>)}</tr>
                <tr>{CHEM.map(([e, v]) => <td key={e} className="border border-slate-300 px-1 text-center">{v}</td>)}</tr>
              </tbody>
            </table>
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[8px]">
              <div>Rp0.2: <b>289 MPa</b></div>
              <div>Rm: <b>624 MPa</b></div>
              <div>A80: <b>%54</b></div>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-300 pt-2 text-[8px] text-slate-500">
              <span>Muayene Sorumlusu: {g.operator}</span>
              <span className="italic">✓ dijital imzalı — mock</span>
            </div>
          </div>
          <button
            onClick={() => setShowCert(false)}
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-2 text-sm text-slate-300 hover:bg-white/10"
          >← Soy ağacına dön</button>
        </>
      )}
    </div>
  );
}
