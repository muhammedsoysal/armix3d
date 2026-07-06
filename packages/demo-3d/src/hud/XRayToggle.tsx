import { useEffect } from "react";
import { useStore } from "zustand";
import { xrayStore } from "../xray/xrayStore";

/** X-Ray / Veri Katmanı anahtarı — buton veya `X` tuşu. */
export function XRayToggle() {
  const active = useStore(xrayStore, (s) => s.active);
  const toggle = useStore(xrayStore, (s) => s.toggle);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x" && !e.repeat) xrayStore.getState().toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      onClick={toggle}
      className={`pointer-events-auto absolute right-6 top-60 z-30 flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur-md transition-all active:scale-95 ${
        active
          ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/25"
          : "border-white/10 bg-black/55 text-neutral-200 hover:bg-white/10"
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.6 9a9.7 9.7 0 0116.8 0M6.2 12.5a6.5 6.5 0 0111.6 0M9 16a3.4 3.4 0 016 0M12 19h.01"
        />
      </svg>
      {active ? "X-Ray Kapat" : "X-Ray Modu"}
      <span className="ml-1 rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">X</span>
    </button>
  );
}
