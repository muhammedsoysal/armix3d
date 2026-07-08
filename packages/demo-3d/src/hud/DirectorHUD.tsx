import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { machineStateStore } from "@metalnest/core";
import { simStore, currentRecommendation } from "../sim/simStore";
import { PIECES_PER_RECOMMENDATION } from "../sim/constants";
import { directorStore } from "../director/directorStore";
import { SHOTS } from "../director/shots";

/** Fuar sunum modu arayüzü: sinemaskop bantlar, alt-üçüncü bilgi bandı ve
 * dron turu sahne göstergesi. Kamera mantığı DirectorCamera'dadır.
 * Olay kadrajları dip-to-black ile kesilir; dron turu sahne geçişleri
 * KESMESİZDİR (sürekli uçuş) — yalnızca alt bant yumuşakça güncellenir. */
export function DirectorHUD() {
  const active = useStore(directorStore, (s) => s.active);
  const shotId = useStore(directorStore, (s) => s.shotId);
  const tourLabel = useStore(directorStore, (s) => s.tourLabel);
  const tourSeg = useStore(directorStore, (s) => s.tourSeg);
  const tourSegCount = useStore(directorStore, (s) => s.tourSegCount);
  const machineState = useStore(machineStateStore, (s) => s.state);
  const plan = useStore(simStore, (s) => s.plan);
  const recIndex = useStore(simStore, (s) => s.recIndex);
  const piecesCutForRec = useStore(simStore, (s) => s.piecesCutForRec);

  const rec = plan ? currentRecommendation(simStore.getState()) : null;
  const shot = shotId ? SHOTS[shotId] : null;
  const label = shot?.label ?? tourLabel;

  // Dip-to-black yalnızca OLAY kesmelerinde — tur sahneleri kesintisiz uçuş
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!shotId || !active) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 240);
    return () => clearTimeout(t);
  }, [shotId, active]);

  return (
    <>
      {/* Kadraj kesme karartması */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity ${
          flash ? "opacity-60 duration-75" : "opacity-0 duration-500"
        }`}
      />
      {/* Sinemaskop bantlar — epik dron turu için geniş (9vh) */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-[9vh] bg-black transition-transform duration-700 ease-out ${
          active ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Üst bant: kurumsal jenerik — ortadaki vardiya rozetiyle çakışmasın
            diye iki yana yaslı */}
        {active && (
          <div className="flex h-full items-center justify-between px-10">
            <span className="text-[10px] font-bold tracking-[0.5em] text-white/60">METALNEST</span>
            <span className="text-[10px] tracking-[0.35em] text-cyan-400/90">
              {shotId ? "CANLI OLAY YAYINI" : "MEGA TESİS — DRON TURU"}
            </span>
          </div>
        )}
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[9vh] bg-black transition-transform duration-700 ease-out ${
          active ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Alt bant: tur sahne ilerlemesi (8 nokta) */}
        {active && !shotId && tourSegCount > 0 && (
          <div className="flex h-full items-center justify-center gap-2">
            {Array.from({ length: tourSegCount }, (_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-700 ${
                  i + 1 === tourSeg ? "w-8 bg-cyan-400" : i + 1 < tourSeg ? "w-2 bg-cyan-400/40" : "w-2 bg-white/15"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Alt-üçüncü: sahne adı + canlı üretim verisi */}
      {active && label && (
        <div
          key={label /* sahne değişince yeniden animasyon */}
          className="pointer-events-none absolute bottom-[11vh] left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-gradient-to-r from-black/75 via-black/60 to-black/75 px-6 py-3 shadow-2xl backdrop-blur-xl">
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
              CANLI
            </span>
            <span className="h-4 w-px bg-white/20" />
            {!shotId && tourSegCount > 0 && (
              <>
                <span className="font-mono text-[11px] tabular-nums text-cyan-300">
                  {tourSeg}/{tourSegCount}
                </span>
                <span className="h-4 w-px bg-white/20" />
              </>
            )}
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {label}
            </span>
            {rec && machineState !== "IDLE" && (
              <>
                <span className="h-4 w-px bg-white/20" />
                <span className="font-mono text-xs text-sky-300">
                  {rec.productName} · {rec.sku} · Kesim{" "}
                  {Math.min(piecesCutForRec + 1, Math.min(rec.recommendedQuantity, PIECES_PER_RECOMMENDATION))}/
                  {Math.min(rec.recommendedQuantity, PIECES_PER_RECOMMENDATION)} · İş {recIndex + 1}/
                  {plan?.recommendations.length ?? 0}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
