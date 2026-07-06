import { useState } from "react";
import { useStore } from "zustand";
import { telemetryStore, type MachineStatus, type MachineTelemetry } from "../telemetry/telemetryStore";

const STATUS_META: Record<MachineStatus, { label: string; dot: string; text: string }> = {
  RUNNING: { label: "ÜRETİMDE", dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]", text: "text-emerald-300" },
  IDLE: { label: "BEKLEMEDE", dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]", text: "text-amber-300" },
  UNLOADING: { label: "BOŞALTMA", dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]", text: "text-sky-300" },
  ALARM: { label: "ALARM", dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]", text: "text-red-300" },
};

/** Güç geçmişinden neon sparkline. */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8" />;
  const W = 120;
  const H = 32;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(" ");
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

function Metric({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5">
      <div className="text-[8px] uppercase tracking-[0.15em] text-slate-500">{label}</div>
      <div className={`font-mono text-sm font-bold ${accent ?? "text-slate-100"}`}>
        {value}
        {unit && <span className="ml-0.5 text-[9px] font-normal text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function MachineCard({ m }: { m: MachineTelemetry }) {
  const st = STATUS_META[m.status];
  const oeeColor = m.oee >= 80 ? "text-emerald-400" : m.oee >= 60 ? "text-amber-400" : "text-red-400";
  const barColor = m.oee >= 80 ? "from-emerald-500 to-cyan-400" : m.oee >= 60 ? "from-amber-500 to-yellow-400" : "from-red-600 to-red-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 shadow-xl transition-colors hover:border-sky-400/30">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-white">{m.name}</div>
          <div className="font-mono text-[9px] text-slate-500">{m.id} · {m.kind}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1">
          <span className={`h-2 w-2 animate-pulse rounded-full ${st.dot}`} />
          <span className={`text-[9px] font-bold tracking-wider ${st.text}`}>{st.label}</span>
        </div>
      </div>
      {/* OEE */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[8px] uppercase tracking-[0.2em] text-slate-500">OEE</div>
          <div className={`font-mono text-2xl font-black leading-none ${oeeColor}`}>%{Math.round(m.oee)}</div>
        </div>
        <Sparkline data={m.history} color="#38bdf8" />
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${m.oee}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <Metric label="Güç" value={m.powerKw} unit="kW" accent="text-cyan-300" />
        <Metric label="Sıcaklık" value={m.tempC} unit="°C" accent={m.tempC > 55 ? "text-red-400" : "text-slate-100"} />
        <Metric label="Titreşim" value={m.vibration} unit="mm/s" accent={m.vibration > 4 ? "text-amber-400" : "text-slate-100"} />
        <Metric label="Parça" value={m.partsToday} accent="text-emerald-300" />
      </div>
    </div>
  );
}

/** Tesis Kontrol Paneli — çok-makineli canlı telemetri (mock WS, 1 Hz).
 * Enterprise MES görünümü: durum çipleri, OEE, neon sparkline, iş kuyruğu. */
export function FactoryDashboard() {
  const [open, setOpen] = useState(false);
  const machines = useStore(telemetryStore, (s) => s.machines);
  const connected = useStore(telemetryStore, (s) => s.connected);
  const slitQueue = useStore(telemetryStore, (s) => s.slitQueue);
  const slitActiveIdx = useStore(telemetryStore, (s) => s.slitActiveIdx);
  const slitProgress = useStore(telemetryStore, (s) => s.slitProgress);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`pointer-events-auto absolute right-6 top-[368px] z-30 flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur-md transition-all active:scale-95 ${
          open
            ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/25"
            : "border-white/10 bg-black/55 text-neutral-200 hover:bg-white/10"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" />
        </svg>
        Tesis
      </button>

      {open && (
        <div className="pointer-events-auto absolute right-6 top-[428px] z-30 max-h-[calc(100vh-460px)] w-[380px] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold tracking-[0.3em] text-slate-300">TESİS KONTROL</span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-red-500"}`} />
              {connected ? "CANLI · WS 1Hz" : "BAĞLANTI YOK"}
            </span>
          </div>
          {Object.values(machines).map((m) => (
            <MachineCard key={m.id} m={m} />
          ))}
          {/* Yarma hattı iş kuyruğu */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              SLT-1 İş Kuyruğu
            </div>
            <div className="space-y-1.5">
              {slitQueue.map((j, i) => {
                const isActive = i === slitActiveIdx;
                return (
                  <div
                    key={j.id}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] ${
                      isActive ? "border-sky-400/40 bg-sky-500/10" : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex justify-between font-mono">
                      <span className={isActive ? "font-bold text-sky-300" : "text-slate-400"}>{j.id}</span>
                      <span className="text-slate-500">{j.program}</span>
                    </div>
                    {isActive && (
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-1000"
                          style={{ width: `${Math.round(slitProgress * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
