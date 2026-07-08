import { useEffect } from "react";
import { useStore } from "zustand";
import { directorStore } from "../director/directorStore";
import { xrayStore } from "../xray/xrayStore";
import { uiStore, type PanelId } from "./uiStore";

/** Tek ince ikon araç çubuğu — 5 devasa etiketli butonun yerini alır.
 * İkon + tooltip; aktif durum renkli halka. Küçük ekranlarda da taşmaz. */
function Btn({
  title,
  active,
  activeClass,
  onClick,
  children,
}: {
  title: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90 ${
        active ? activeClass : "border-transparent text-neutral-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const director = useStore(directorStore, (s) => s.active);
  const xray = useStore(xrayStore, (s) => s.active);
  const openPanel = useStore(uiStore, (s) => s.openPanel);
  const toggle = (p: Exclude<PanelId, null>) => uiStore.getState().toggle(p);

  // X kısayolu (eski XRayToggle'dan devralındı)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x" && !e.repeat) xrayStore.getState().toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sw = 1.8;
  return (
    <div className="pointer-events-auto absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
      <Btn
        title="Sunum Modu (fuar otopilotu)"
        active={director}
        activeClass="border-red-400/60 bg-red-500/20 text-red-300"
        onClick={() => (director ? directorStore.getState().deactivate() : directorStore.getState().activate())}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      </Btn>
      <Btn
        title="X-Ray Veri Katmanı (X)"
        active={xray}
        activeClass="border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
        onClick={() => xrayStore.getState().toggle()}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" d="M3.6 9a9.7 9.7 0 0116.8 0M6.2 12.5a6.5 6.5 0 0111.6 0M9 16a3.4 3.4 0 016 0M12 19h.01" />
        </svg>
      </Btn>
      <Btn
        title="Senaryo Sandbox (acil sipariş, ağırlıklar, Akıllı Grupla)"
        active={openPanel === "whatif"}
        activeClass="border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
        onClick={() => toggle("whatif")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v5.2L4.7 17a2 2 0 001.8 3h11a2 2 0 001.8-3L14 8.2V3" />
        </svg>
      </Btn>
      <Btn
        title="Üretim Planı — Gantt"
        active={openPanel === "gantt"}
        activeClass="border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
        onClick={() => toggle("gantt")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" d="M4 6h8M4 12h12M4 18h6M18 4v16" />
        </svg>
      </Btn>
      <Btn
        title="Tesis Kontrol (canlı telemetri)"
        active={openPanel === "dashboard"}
        activeClass="border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
        onClick={() => toggle("dashboard")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" />
        </svg>
      </Btn>
      <Btn
        title="Vardiya Raporu (PDF)"
        active={openPanel === "report"}
        activeClass="border-sky-400/60 bg-sky-500/20 text-sky-300"
        onClick={() => toggle("report")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5" />
        </svg>
      </Btn>
    </div>
  );
}
