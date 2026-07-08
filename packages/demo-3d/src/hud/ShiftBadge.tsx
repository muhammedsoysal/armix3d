import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { introStore } from "./Splash";
import { shiftInfo } from "./shiftMath";

/** Vardiya rozeti — üst-orta, cam panel: canlı saat (tabular-nums),
 * vardiya numarası + aralığı ve ince ilerleme çubuğu. Fabrikaya "şu an
 * yaşıyor" hissi verir; kiosk modunda da görünür. */
export function ShiftBadge() {
  const phase = useStore(introStore, (s) => s.phase);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (phase !== "done") return null;
  const s = shiftInfo(now);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/55 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
        </span>
        <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-300">VARDİYA {s.no}</span>
        <span className="font-mono text-[10px] tabular-nums text-slate-500">{s.range}</span>
        <span className="font-mono text-sm font-bold tabular-nums text-white">
          {hh}:{mm}
          <span className="text-slate-500">:{ss}</span>
        </span>
      </div>
      {/* Vardiya ilerlemesi */}
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-1000"
          style={{ width: `${Math.round(s.progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
