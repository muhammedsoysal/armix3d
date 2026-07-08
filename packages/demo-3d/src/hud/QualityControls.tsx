import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { qualityStore, type QualityLevel } from "../quality/qualityStore";

const LEVELS: { id: QualityLevel; label: string }[] = [
  { id: "low", label: "Düşük" },
  { id: "medium", label: "Orta" },
  { id: "ultra", label: "Ultra" },
];

function useFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

/** Dokunmatik ekran için büyük kalite butonları + anlık FPS göstergesi. */
export function QualityControls() {
  const level = useStore(qualityStore, (s) => s.level);
  const setLevel = useStore(qualityStore, (s) => s.setLevel);
  const fps = useFps();

  return (
    <div className="pointer-events-auto absolute right-6 top-[86px] flex w-[400px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/55 p-2 backdrop-blur-md">
      {LEVELS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setLevel(id)}
          className={`min-w-[64px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
            level === id
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "bg-white/5 text-neutral-300 hover:bg-white/10"
          }`}
        >
          {label}
        </button>
      ))}
      <div className="ml-1 w-16 text-center">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">FPS</div>
        <div
          className={`font-mono text-lg font-bold ${
            fps >= 55 ? "text-emerald-400" : fps >= 30 ? "text-amber-400" : "text-red-400"
          }`}
        >
          {fps || "—"}
        </div>
      </div>
    </div>
  );
}
