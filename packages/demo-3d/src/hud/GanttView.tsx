import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { simStore } from "../sim/simStore";
import { telemetryStore } from "../telemetry/telemetryStore";
import { alarmStore } from "../alarm/alarmStore";
import { uiStore } from "./uiStore";

/**
 * Gantt / Planlama Görünümü — her MES'in kalbi. Saf SVG, kütüphanesiz.
 * Zaman penceresi: şimdi−4dk … şimdi+6dk; "şimdi" çizgisi canlı akar.
 * Bloklar salt görsel (sürüklenmez): geçmiş soluk, aktif cyan, gelecek
 * çerçeveli, alarmlar kırmızı şerit.
 */

const PIECE_S = 12.4; // CTL-1 parça çevrimi (sn)
const SLIT_S = 75; // SLT-1 desen döngüsü
const LSR_S = 11.5; // LSR-2 hücre döngüsü
const WIN_PAST = 240_000; // ms
const WIN_FUT = 360_000;
const W = 1200; // SVG viewBox genişliği
const ROW_H = 46;
const LABEL_W = 120;

interface Block {
  start: number; // epoch ms
  end: number;
  label: string;
  kind: "done" | "active" | "future" | "alarm";
}

function x(t: number, now: number): number {
  return LABEL_W + ((t - (now - WIN_PAST)) / (WIN_PAST + WIN_FUT)) * (W - LABEL_W);
}

const KIND_STYLE: Record<Block["kind"], { fill: string; stroke: string; opacity: number }> = {
  done: { fill: "#334155", stroke: "#475569", opacity: 0.5 },
  active: { fill: "#0e7490", stroke: "#22d3ee", opacity: 1 },
  future: { fill: "#1e293b", stroke: "#64748b", opacity: 0.9 },
  alarm: { fill: "#7f1d1d", stroke: "#ef4444", opacity: 1 },
};

function Row({ y, name, blocks, now }: { y: number; name: string; blocks: Block[]; now: number }) {
  return (
    <g>
      <text x={12} y={y + ROW_H / 2 + 4} fill="#94a3b8" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace">
        {name}
      </text>
      <line x1={LABEL_W} y1={y + ROW_H} x2={W} y2={y + ROW_H} stroke="#1e293b" strokeWidth={1} />
      {blocks.map((b, i) => {
        const bx = Math.max(LABEL_W, x(b.start, now));
        const bw = Math.max(2, x(b.end, now) - bx);
        if (bx > W || x(b.end, now) < LABEL_W) return null;
        const st = KIND_STYLE[b.kind];
        return (
          <g key={i} opacity={st.opacity}>
            <rect x={bx} y={y + 7} width={Math.min(bw, W - bx)} height={ROW_H - 14} rx={4} fill={st.fill} stroke={st.stroke} strokeWidth={1.2} />
            {bw > 46 && (
              <text x={bx + 6} y={y + ROW_H / 2 + 4} fill={b.kind === "done" ? "#64748b" : "#e2e8f0"} fontSize={10.5} fontFamily="ui-monospace, monospace">
                {b.label.slice(0, Math.floor(bw / 7))}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function GanttView() {
  const open = useStore(uiStore, (s) => s.openPanel === "gantt");
  const plan = useStore(simStore, (s) => s.plan);
  const recIndex = useStore(simStore, (s) => s.recIndex);
  const piecesCutForRec = useStore(simStore, (s) => s.piecesCutForRec);
  const slitQueue = useStore(telemetryStore, (s) => s.slitQueue);
  const slitActiveIdx = useStore(telemetryStore, (s) => s.slitActiveIdx);
  const slitProgress = useStore(telemetryStore, (s) => s.slitProgress);
  const alarmHistory = useStore(alarmStore, (s) => s.history);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open || !plan) return null;

  // CTL-1: aktif işin başlangıcını geriye sar, tüm planı zincirle
  const jobDur = (qty: number) => Math.min(qty, 3) * PIECE_S * 1000;
  const curStart = now - piecesCutForRec * PIECE_S * 1000;
  const ctl: Block[] = [];
  let t = curStart;
  for (let i = recIndex; i < plan.recommendations.length; i++) {
    const r = plan.recommendations[i];
    const d = jobDur(r.recommendedQuantity);
    ctl.push({ start: t, end: t + d, label: r.productName, kind: i === recIndex ? "active" : "future" });
    t += d;
  }
  let tb = curStart;
  for (let i = recIndex - 1; i >= 0; i--) {
    const r = plan.recommendations[i];
    const d = jobDur(r.recommendedQuantity);
    ctl.unshift({ start: tb - d, end: tb, label: r.productName, kind: "done" });
    tb -= d;
  }

  // SLT-1: desen döngüsü zinciri
  const slitCurStart = now - slitProgress * SLIT_S * 1000;
  const slt: Block[] = [];
  let ts = slitCurStart;
  for (let k = 0; k < 8; k++) {
    const j = slitQueue[(slitActiveIdx + k) % slitQueue.length];
    slt.push({ start: ts, end: ts + SLIT_S * 1000, label: `${j.id} ${j.program}`, kind: k === 0 ? "active" : "future" });
    ts += SLIT_S * 1000;
  }
  let tsb = slitCurStart;
  for (let k = 1; k <= 4; k++) {
    const j = slitQueue[(slitActiveIdx - k + slitQueue.length * 4) % slitQueue.length];
    slt.unshift({ start: tsb - SLIT_S * 1000, end: tsb, label: j.id, kind: "done" });
    tsb -= SLIT_S * 1000;
  }

  // LSR-2: sürekli hücre döngüsü
  const lsr: Block[] = [];
  const phase0 = now - ((now / 1000) % LSR_S) * 1000;
  for (let k = -20; k < 32; k++) {
    const s = phase0 + k * LSR_S * 1000;
    lsr.push({
      start: s,
      end: s + LSR_S * 1000 - 800,
      label: `NC-${1040 + k}`,
      kind: s + LSR_S * 1000 < now ? "done" : s <= now ? "active" : "future",
    });
  }

  // Alarm blokları (CTL-1 satırına bindirilir)
  const alarms: Block[] = alarmHistory
    .filter((a) => a.end > now - WIN_PAST)
    .map((a) => ({ start: a.start, end: Math.min(a.end, now), label: "⚠ " + a.note, kind: "alarm" as const }));

  const rows: [string, Block[]][] = [
    ["CTL-1", [...ctl, ...alarms]],
    ["SLT-1", slt],
    ["LSR-2", lsr],
  ];
  const nowX = x(now, now);
  const ticks = Array.from({ length: 11 }, (_, i) => now - WIN_PAST + (i * (WIN_PAST + WIN_FUT)) / 10);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 h-[46vh] border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.3em] text-slate-300">ÜRETİM PLANI — GANTT</span>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] text-cyan-300">CANLI</span>
        </div>
        <button
          onClick={() => uiStore.getState().toggle("gantt")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
        >✕</button>
      </div>
      <div className="h-[calc(46vh-52px)] overflow-x-auto px-2">
        <svg viewBox={`0 0 ${W} ${ROW_H * 3 + 34}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {/* Zaman ızgarası */}
          {ticks.map((tt, i) => (
            <g key={i}>
              <line x1={x(tt, now)} y1={20} x2={x(tt, now)} y2={ROW_H * 3 + 20} stroke="#1e293b" strokeWidth={1} />
              <text x={x(tt, now)} y={12} fill="#475569" fontSize={9.5} textAnchor="middle" fontFamily="ui-monospace, monospace">
                {i === 4 ? "şimdi" : `${Math.round((tt - now) / 60000)}dk`}
              </text>
            </g>
          ))}
          {rows.map(([name, blocks], i) => (
            <Row key={name} y={20 + i * ROW_H} name={name} blocks={blocks} now={now} />
          ))}
          {/* ŞİMDİ çizgisi — canlı akar */}
          <line x1={nowX} y1={16} x2={nowX} y2={ROW_H * 3 + 22} stroke="#22d3ee" strokeWidth={2} />
          <circle cx={nowX} cy={16} r={4} fill="#22d3ee" />
        </svg>
      </div>
    </div>
  );
}
