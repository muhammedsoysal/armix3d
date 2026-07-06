import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { machineStateStore, type MachineState } from "@metalnest/core";
import { COIL, PIECES_PER_RECOMMENDATION, coilRadiusFor, simFrame } from "../sim/constants";
import { currentRecommendation, simStore } from "../sim/simStore";

const STATE_LABEL: Record<MachineState, string> = {
  IDLE: "BEKLEMEDE",
  FEEDING: "SAC BESLEME",
  CUTTING: "KESİM",
  LIFTING: "PALETLEME",
};

const STATE_COLOR: Record<MachineState, string> = {
  IDLE: "bg-slate-400",
  FEEDING: "bg-sky-400",
  CUTTING: "bg-orange-400",
  LIFTING: "bg-emerald-400",
};

/** simFrame (mutable, 60fps) değerlerini HUD için 10Hz'e örnekler. */
function useSimSnapshot() {
  const [snap, setSnap] = useState({ coilPercent: 100, phaseProgress: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      const r = coilRadiusFor(simFrame.totalFedLength);
      setSnap({
        coilPercent: Math.round(((r - COIL.RMIN) / (COIL.R0 - COIL.RMIN)) * 100),
        phaseProgress: simFrame.progress,
      });
    }, 100);
    return () => clearInterval(id);
  }, []);
  return snap;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/55 p-4 text-neutral-200 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function ProductionPlanHUD() {
  const machineState = useStore(machineStateStore, (s) => s.state);
  const plan = useStore(simStore, (s) => s.plan);
  const recIndex = useStore(simStore, (s) => s.recIndex);
  const piecesCutForRec = useStore(simStore, (s) => s.piecesCutForRec);
  const totalPieces = useStore(simStore, (s) => s.totalPiecesCut);
  const palletCount = useStore(simStore, (s) => s.palletStack.length);
  const { coilPercent, phaseProgress } = useSimSnapshot();

  const [mockTasks, setMockTasks] = useState([
    { id: 1, name: "Gövde Yan Panel - SKU-001", status: "Üretildi" },
    { id: 2, name: "Gövde Yan Panel - SKU-001", status: "Üretildi" },
    { id: 3, name: "Motor Kapağı - SKU-042", status: "Üretiliyor" },
    { id: 4, name: "Şasi Alt Plaka - SKU-089", status: "Bekliyor" },
    { id: 5, name: "Bağlantı Braketi - SKU-112", status: "Bekliyor" },
  ]);

  const removeTask = (id: number) => {
    setMockTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const rec = plan ? currentRecommendation(simStore.getState()) : null;
  const upNext = plan
    ? [1, 2, 3].map((o) => plan.recommendations[(recIndex + o) % plan.recommendations.length])
    : [];

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-sans">
      {/* Başlık */}
      <div className="absolute left-6 top-5">
        <div className="text-lg font-bold tracking-wide text-white">MetalNest Digital Twin</div>
        <div className="text-xs uppercase tracking-[0.25em] text-sky-300/80">
          Fuar Modu · Akıllı Üretim Motoru
        </div>
      </div>

      {/* Sağ üst: hat metrikleri */}
      <Panel className="absolute right-6 top-5 flex gap-6">
        {[
          ["Rulo Doluluk", `%${coilPercent}`],
          ["Paletteki Parça", String(palletCount)],
          ["Toplam Kesim", String(totalPieces)],
        ].map(([label, value]) => (
          <div key={label} className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</div>
            <div className="font-mono text-xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </Panel>

      {/* Sol Orta: İş Listesi (Mock Data) */}
      <Panel className="absolute left-6 top-28 w-[320px] pointer-events-auto">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-neutral-400">
          Örnek İş Yükü Listesi
        </div>
        <div className="space-y-2">
          {mockTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between text-[13px] bg-white/5 rounded p-2 border border-white/5">
              <div>
                <div className="text-neutral-200">{task.name}</div>
                <div className={`text-[10px] mt-0.5 ${task.status === "Üretildi" ? "text-emerald-400" : task.status === "Üretiliyor" ? "text-orange-400" : "text-neutral-400"}`}>
                  {task.status}
                </div>
              </div>
              <button 
                onClick={() => removeTask(task.id)}
                className="text-neutral-500 hover:text-red-400 px-2 text-lg leading-none"
                title="Listeden Kaldır"
              >
                ×
              </button>
            </div>
          ))}
          {mockTasks.length === 0 && (
            <div className="text-xs text-neutral-500 italic py-2">Tüm işler tamamlandı veya silindi.</div>
          )}
        </div>
      </Panel>

      {/* Sol alt: aktif iş */}
      <Panel className="absolute bottom-6 left-6 w-[440px] border border-white/20 bg-gradient-to-br from-black/80 to-black/40 shadow-2xl backdrop-blur-xl">
        {rec ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <span className={`h-2.5 w-2.5 rounded-full ${STATE_COLOR[machineState]} animate-pulse`} />
                <span className="font-mono text-xs font-bold tracking-widest text-neutral-200">
                  {STATE_LABEL[machineState]}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
                  Aşama İlerlemesi
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-[width] duration-100 ease-linear shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    style={{ width: `${Math.round(phaseProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] uppercase tracking-widest text-sky-400/80 font-semibold mb-1">
              Aktif Üretim
            </div>
            <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent drop-shadow-sm">
              {rec.productName}
            </div>
            
            <div className="mt-3 relative pl-4 py-1 border-l-2 border-indigo-500/50">
              <p className="text-[13px] leading-relaxed text-neutral-300 italic opacity-90">
                "{rec.reasoning}"
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-orange-400/80">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Fire Oranı</span>
                </div>
                <div className="text-lg font-mono font-semibold text-orange-100">
                  %{rec.estimatedScrapPercent}
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-sky-400/80">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Öncelik</span>
                </div>
                <div className="text-lg font-mono font-semibold text-sky-100">
                  {rec.priorityScore.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-emerald-400/80">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Kesim</span>
                </div>
                <div className="text-lg font-mono font-semibold text-emerald-100">
                  {piecesCutForRec + (machineState === "IDLE" ? 0 : 1)}<span className="text-emerald-500/50 text-sm">/{Math.min(rec.recommendedQuantity, PIECES_PER_RECOMMENDATION)}</span>
                </div>
              </div>
            </div>

            {rec.sourceStockItems[0]?.isStale && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 py-2 px-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <svg className="w-4 h-4 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="text-[11px] font-bold tracking-widest text-red-300">ATIL STOK ERİTİLİYOR</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="flex items-center gap-3 text-neutral-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span className="text-sm font-medium tracking-wide">Üretim planı yükleniyor…</span>
            </div>
          </div>
        )}
      </Panel>


    </div>
  );
}
