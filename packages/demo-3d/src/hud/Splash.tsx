import { useEffect, useState } from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { simStore } from "../sim/simStore";
import { telemetryStore } from "../telemetry/telemetryStore";
import { assetStore } from "../assets/AssetLoader";

/** Açılış akışı fazı: yükleme → sinematik kamera inişi → hazır. */
export const introStore = createStore<{ phase: "loading" | "descending" | "done" }>()(() => ({
  phase: "loading",
}));

const STEPS: [string, () => boolean][] = [
  ["Varlık kayıt defteri", () => assetStore.getState().loaded],
  ["Karar Motoru — plan derleniyor", () => simStore.getState().plan !== null],
  ["Telemetri akışı", () => telemetryStore.getState().connected],
];
const MIN_MS = 1400; // logo nefes alsın

/** Markalı açılış ekranı — progress GERÇEK yükleme adımlarına bağlı. */
export function Splash() {
  const phase = useStore(introStore, (s) => s.phase);
  const [doneCount, setDoneCount] = useState(0);
  const [mountedAt] = useState(() => Date.now());
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => {
      const n = STEPS.filter(([, ok]) => ok()).length;
      setDoneCount(n);
      if (n === STEPS.length && Date.now() - mountedAt > MIN_MS) {
        clearInterval(id);
        setFading(true);
        setTimeout(() => introStore.setState({ phase: "descending" }), 500);
      }
    }, 120);
    return () => clearInterval(id);
  }, [phase, mountedAt]);

  if (phase !== "loading") return null;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#0a0c10] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo: altıgen M */}
      <svg width="72" height="72" viewBox="0 0 72 72" className="mb-5">
        <polygon
          points="36,4 64,20 64,52 36,68 8,52 8,20"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.6))" }}
        />
        <path d="M22 48V26l14 14 14-14v22" fill="none" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-xl font-bold tracking-[0.25em] text-white">METALNEST</div>
      <div className="mb-8 text-[11px] tracking-[0.45em] text-cyan-400">DIGITAL TWIN</div>
      <div className="w-64">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-300" style={{ width: `${Math.max(8, pct)}%` }} />
        </div>
        <div className="text-center font-mono text-[10px] text-slate-500">
          {doneCount < STEPS.length ? `${STEPS[doneCount][0]}…` : "Hazır"}
        </div>
      </div>
    </div>
  );
}

const OB_KEY = "mn-onboarded";
const TIPS = [
  { title: "Araç Çubuğu", body: "Sağdaki ikonlardan Sunum, X-Ray, Senaryo, Gantt, Tesis ve Rapor panellerine ulaşırsın." },
  { title: "X-Ray Veri Katmanı", body: "X tuşuna bas: tesis hologram moduna geçer, canlı veriler makinelerin üzerinde belirir." },
  { title: "İzlenebilirlik", body: "Sevkiyat sahasındaki herhangi bir palete tıkla — döküm numarası ve EN 10204 sertifikası açılır." },
];

/** İlk ziyaret: 3 adımlık yumuşak ipucu turu. */
export function Onboarding() {
  const phase = useStore(introStore, (s) => s.phase);
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (phase !== "done") return;
    try {
      if (!localStorage.getItem(OB_KEY)) setShow(true);
    } catch {
      /* kiosk storage kapalıysa turu atla */
    }
  }, [phase]);

  if (!show) return null;
  const next = () => {
    if (step < TIPS.length - 1) setStep(step + 1);
    else {
      try {
        localStorage.setItem(OB_KEY, "1");
      } catch { /* yoksay */ }
      setShow(false);
    }
  };
  const tip = TIPS[step];

  return (
    <div className="pointer-events-auto absolute bottom-24 right-16 z-[80] w-72 rounded-2xl border border-cyan-400/40 bg-slate-950/95 p-4 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-300">{tip.title.toUpperCase()}</span>
        <span className="font-mono text-[10px] text-slate-500">{step + 1}/{TIPS.length}</span>
      </div>
      <p className="mb-3 text-[12px] leading-relaxed text-slate-300">{tip.body}</p>
      <button onClick={next} className="w-full rounded-lg bg-cyan-500/20 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30">
        {step < TIPS.length - 1 ? "Sıradaki" : "Anladım, başlayalım"}
      </button>
    </div>
  );
}
