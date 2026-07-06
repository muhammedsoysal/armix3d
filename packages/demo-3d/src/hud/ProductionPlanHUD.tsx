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
      className={`pointer-events-none rounded-2xl border border-white/10 bg-black/55 p-4 text-neutral-200 shadow-xl backdrop-blur-md ${className}`}
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

      {/* Sol alt: aktif iş */}
      <Panel className="absolute bottom-6 left-6 w-[440px]">
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${STATE_COLOR[machineState]} animate-pulse`} />
          <span className="font-mono text-xs tracking-widest text-neutral-300">
            {STATE_LABEL[machineState]}
          </span>
          <div className="ml-auto h-1 w-24 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-sky-400/80 transition-[width] duration-100"
              style={{ width: `${Math.round(phaseProgress * 100)}%` }}
            />
          </div>
        </div>

        {rec ? (
          <>
            <div className="text-[10px] uppercase tracking-wider text-neutral-400">
              Şu an kesiliyor · Kaynak: Karar Motoru
            </div>
            <div className="mt-0.5 text-xl font-bold text-white">{rec.productName}</div>
            <p className="mt-1.5 text-[13px] leading-snug text-neutral-300">{rec.reasoning}</p>
            <div className="mt-3 flex gap-2 text-[11px] font-medium">
              <span className="rounded-md bg-orange-400/15 px-2 py-1 text-orange-300">
                Fire %{rec.estimatedScrapPercent}
              </span>
              <span className="rounded-md bg-sky-400/15 px-2 py-1 text-sky-300">
                Skor {rec.priorityScore.toFixed(2)}
              </span>
              <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-emerald-300">
                Adet {piecesCutForRec + (machineState === "IDLE" ? 0 : 1)}/
                {Math.min(rec.recommendedQuantity, PIECES_PER_RECOMMENDATION)}
              </span>
              {rec.sourceStockItems[0]?.isStale && (
                <span className="rounded-md bg-red-400/20 px-2 py-1 text-red-300">ATIL STOK ERİTİLİYOR</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">Üretim planı yükleniyor…</div>
        )}
      </Panel>

      {/* Sağ alt: sıradaki işler */}
      {plan && (
        <Panel className="absolute bottom-6 right-6 w-[300px]">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-neutral-400">
            Sıradaki İşler
          </div>
          <ol className="space-y-1.5">
            {upNext.map((r, i) => (
              <li key={r.sku} className="flex items-baseline gap-2 text-[13px]">
                <span className="font-mono text-neutral-500">{i + 1}.</span>
                <span className="flex-1 truncate text-neutral-200">{r.productName}</span>
                <span className="font-mono text-[11px] text-neutral-400">%{r.estimatedScrapPercent}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
