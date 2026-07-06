import { createStore } from "zustand/vanilla";

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

export const SLIT_JOBS: SlitJob[] = [
  { id: "SJ-101", program: "1250 → 5×244mm", material: "304 BA 1.5mm", mults: 5 },
  { id: "SJ-102", program: "1250 → 3×410mm", material: "316L 2.0mm", mults: 3 },
  { id: "SJ-103", program: "1000 → 4×245mm", material: "430 2B 1.0mm", mults: 4 },
  { id: "SJ-104", program: "1250 → 6×203mm", material: "304 2B 1.2mm", mults: 6 },
];

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
