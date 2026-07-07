import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { LAYOUT } from "../sim/constants";
import { currentPart, simStore } from "../sim/simStore";
import { packGuillotine } from "@metalnest/core";
import { nestCandidates, computeNest, type NestCandidate } from "../nesting/nestingMath";

const KERF_MM = 5;
const SHEET_W_MM = LAYOUT.sheetWidth * 1000;
const STEP_MS = 450; // aday başına gösterim
const LOCK_MS = 2200; // kazanan damgası

/** Aday yerleşimin mini önizlemesi (SVG — canvas'a gerek yok). */
function NestPreview({ cand, pieceLmm }: { cand: NestCandidate; pieceLmm: number }) {
  const W = 132;
  const H = 64;
  const sx = W / pieceLmm;
  const sy = H / SHEET_W_MM;
  return (
    <svg width={W} height={H} className="rounded border border-white/15 bg-slate-950/80">
      {/* fire: en artığı */}
      <rect
        x={0}
        y={cand.nest.usedWmm * sy}
        width={W}
        height={Math.max(0, (SHEET_W_MM - cand.nest.usedWmm) * sy)}
        fill="rgba(239,68,68,0.25)"
      />
      {cand.nest.cells.map((c, i) => (
        <rect
          key={i}
          x={c.x0 * sx}
          y={c.z0 * sy}
          width={c.l * sx}
          height={c.w * sy}
          fill="rgba(56,189,248,0.25)"
          stroke="#38bdf8"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

type Phase = { kind: "thinking"; idx: number } | { kind: "locked" } | null;

/** Karar Motoru "düşünürken" adayları sırayla gösterir, sonra kazananı
 * yeşil damgayla kilitler — optimizasyon görünür hale gelir. */
export function OptimizerThinkingHUD() {
  const recIndex = useStore(simStore, (s) => s.recIndex);
  const plan = useStore(simStore, (s) => s.plan);
  const [phase, setPhase] = useState<Phase>(null);
  const [cands, setCands] = useState<NestCandidate[]>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!plan) return;
    const part = currentPart(simStore.getState());
    if (!part) return;
    const { width: pw, length: pl } = part.partDimensions;
    const list = nestCandidates(pw, pl, SHEET_W_MM, pl, KERF_MM);
    setCands(list);

    timersRef.current.forEach(clearTimeout);
    const timers: number[] = [];
    list.forEach((_, i) => {
      timers.push(window.setTimeout(() => setPhase({ kind: "thinking", idx: i }), i * STEP_MS));
    });
    timers.push(window.setTimeout(() => setPhase({ kind: "locked" }), list.length * STEP_MS));
    timers.push(
      window.setTimeout(() => setPhase(null), list.length * STEP_MS + LOCK_MS),
    );
    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [plan, recIndex]);

  if (!phase || cands.length === 0) return null;
  const part = currentPart(simStore.getState());
  const pieceLmm = part?.partDimensions.length ?? 1000;
  const winner = cands.find((c) => c.chosen)!;
  const shown = phase.kind === "thinking" ? cands[phase.idx] : winner;

  // MATEMATİKSEL KANIT: eski grid motoru vs yeni giyotin motoru, aynı parça
  let proof: { gridPct: number; guilloPct: number } | null = null;
  if (phase.kind === "locked" && part) {
    const { width: pw, length: pl } = part.partDimensions;
    const gridPct = Math.round(computeNest(pw, pl, SHEET_W_MM, pl, KERF_MM).scrapRatio * 1000) / 10;
    const maxQty = Math.ceil(((SHEET_W_MM + KERF_MM) * (pl + KERF_MM)) / (pw * pl));
    const guilloPct = packGuillotine([{ id: part.sku, w: pw, l: pl, qty: maxQty }], SHEET_W_MM, pl, KERF_MM).scrapPct;
    proof = { gridPct, guilloPct };
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2">
      <div
        className={`flex items-center gap-4 rounded-xl border px-5 py-3 shadow-2xl backdrop-blur-xl transition-colors duration-200 ${
          phase.kind === "locked"
            ? "border-emerald-400/60 bg-emerald-950/80"
            : "border-sky-400/40 bg-slate-950/80"
        }`}
      >
        <NestPreview cand={shown} pieceLmm={pieceLmm} />
        <div className="min-w-[210px]">
          <div
            className={`mb-1 text-[10px] font-bold tracking-[0.25em] ${
              phase.kind === "locked" ? "text-emerald-400" : "animate-pulse text-sky-400"
            }`}
          >
            {phase.kind === "locked" ? "✓ YERLEŞİM SEÇİLDİ" : "NESTING OPTİMİZASYONU…"}
          </div>
          <div className="text-sm font-semibold text-white">{shown.label}</div>
          <div className="mt-0.5 font-mono text-xs">
            <span className="text-slate-400">Fire: </span>
            <span className={shown.chosen ? "font-bold text-emerald-400" : "text-red-400"}>
              %{shown.scrapPct}
            </span>
            {phase.kind === "locked" && (
              <span className="ml-2 text-slate-400">
                ({cands.length - 1} aday elendi · en kötü %
                {Math.max(...cands.map((c) => c.scrapPct))})
              </span>
            )}
          </div>
          {proof && (
            <div className="mt-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px]">
              <span className="text-slate-400">Grid motor: </span>
              <span className="text-red-400 line-through">%{proof.gridPct}</span>
              <span className="mx-1.5 text-slate-500">→</span>
              <span className="text-slate-400">Guillotine v2: </span>
              <span className="font-bold text-emerald-400">%{proof.guilloPct}</span>
              {proof.gridPct > proof.guilloPct && (
                <span className="ml-1.5 font-bold text-emerald-300">
                  (−{Math.round((proof.gridPct - proof.guilloPct) * 10) / 10} puan)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
