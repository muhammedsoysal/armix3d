import { createStore } from "zustand/vanilla";
import { naiveTrimPct, planSlitting } from "@metalnest/core";

export type MachineStatus = "RUNNING" | "IDLE" | "UNLOADING" | "ALARM";

export interface MachineTelemetry {
  id: string;
  name: string;
  kind: string;
  status: MachineStatus;
  /** 0-100 */
  oee: number;
  powerKw: number;
  tempC: number;
  /** mm/s RMS */
  vibration: number;
  partsToday: number;
  /** Son 40 örnek güç geçmişi — sparkline için */
  history: number[];
}

export interface SlitJob {
  id: string;
  program: string;
  material: string;
  mults: number;
  /** Bu desen kaç rulodan koşulacak */
  runs: number;
  trimMm: number;
}

/** Çok-makineli tesis telemetrisi. Veri `liveTelemetryService` üzerinden
 * WebSocket-benzeri push ile gelir; UI yalnızca bu store'u okur.
 * Gerçek entegrasyonda servisin fetch/WS ucu ERP/SCADA'ya bağlanır. */
export interface TelemetryStoreState {
  machines: Record<string, MachineTelemetry>;
  connected: boolean;
  /** Yarma hattı global iş kuyruğu */
  slitQueue: SlitJob[];
  slitActiveIdx: number;
  slitProgress: number;
  updateMachine: (id: string, patch: Partial<MachineTelemetry>) => void;
  setConnected: (connected: boolean) => void;
  setSlitProgress: (progress: number) => void;
  advanceSlitJob: () => void;
}

function machine(id: string, name: string, kind: string): MachineTelemetry {
  return {
    id,
    name,
    kind,
    status: "IDLE",
    oee: 0,
    powerKw: 0,
    tempC: 22,
    vibration: 0,
    partsToday: 0,
    history: [],
  };
}

/** Dilme sipariş defteri (mock — ERP'den gelecek) ve 1D CSP optimizasyonu. */
const SLIT_ORDERS = [
  { widthMm: 244, qty: 20 },
  { widthMm: 410, qty: 12 },
  { widthMm: 203, qty: 18 },
  { widthMm: 245, qty: 16 },
];
const SLIT_COIL_W = 1250;
const SLIT_KERF = 5;

const slitPlan = planSlitting(SLIT_ORDERS, SLIT_COIL_W, SLIT_KERF);

/** MATEMATİKSEL KANIT: optimize trim vs naif (tek-genişlik desenler) trim. */
export const SLIT_TRIM_PROOF = {
  optimizedPct: slitPlan.totalTrimPct,
  naivePct: naiveTrimPct(SLIT_ORDERS, SLIT_COIL_W, SLIT_KERF),
};

export const SLIT_JOBS: SlitJob[] = slitPlan.patterns.map((p, i) => ({
  id: `SJ-${101 + i}`,
  program: `${SLIT_COIL_W} → ${p.widths.join("+")}mm`,
  material: "304 BA 1.5mm",
  mults: p.widths.length,
  runs: p.runs,
  trimMm: p.trimMm,
}));
console.log(
  `[SLIT-CSP] ${SLIT_JOBS.length} optimal desen · trim %${SLIT_TRIM_PROOF.optimizedPct} (naif %${SLIT_TRIM_PROOF.naivePct})`,
);

export const telemetryStore = createStore<TelemetryStoreState>()((set) => ({
  machines: {
    "CTL-1": machine("CTL-1", "Boy Kesme Hattı 1", "Cut-to-Length"),
    "SLT-1": machine("SLT-1", "Yarma Hattı 1", "Slitting"),
    "LSR-2": machine("LSR-2", "Lazer Kesim 2", "Fiber Laser"),
  },
  connected: false,
  slitQueue: SLIT_JOBS,
  slitActiveIdx: 0,
  slitProgress: 0,
  updateMachine: (id, patch) =>
    set((s) => {
      const m = s.machines[id];
      if (!m) return s;
      return { machines: { ...s.machines, [id]: { ...m, ...patch } } };
    }),
  setConnected: (connected) => set({ connected }),
  setSlitProgress: (slitProgress) => set({ slitProgress }),
  advanceSlitJob: () =>
    set((s) => {
      const next = (s.slitActiveIdx + 1) % s.slitQueue.length;
      console.log(`[TELEMETRY] SLT-1 iş tamamlandı → sıradaki: ${s.slitQueue[next].id}`);
      return { slitActiveIdx: next, slitProgress: 0 };
    }),
}));
