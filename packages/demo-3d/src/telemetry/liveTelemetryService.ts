import { machineStateStore } from "@metalnest/core";
import { telemetryStore, type MachineStatus } from "./telemetryStore";

/**
 * Canlı telemetri servisi — WebSocket akışını simüle eder (1 Hz push).
 * Gerçek entegrasyonda `connect()` içindeki interval yerine
 * `new WebSocket(SCADA_URL)` / periyodik `fetch()` bağlanır; store API'si
 * ve tüm UI aynı kalır. CTL-1 durumu GERÇEK makine state'inden gelir,
 * sensör değerleri (güç/sıcaklık/titreşim) duruma bağlı jitter'lı üretilir.
 */

const HISTORY_LEN = 40;
let timer: ReturnType<typeof setInterval> | null = null;

function jitter(base: number, amp: number): number {
  return Math.round((base + (Math.random() - 0.5) * amp) * 10) / 10;
}

function push(id: string, status: MachineStatus, basePower: number, baseOee: number) {
  const s = telemetryStore.getState();
  const m = s.machines[id];
  if (!m) return;
  const running = status === "RUNNING";
  const powerKw = running ? jitter(basePower, basePower * 0.18) : jitter(1.2, 0.6);
  s.updateMachine(id, {
    status,
    powerKw,
    tempC: jitter(running ? 41 : 24, 3),
    vibration: running ? jitter(2.1, 1.4) : jitter(0.2, 0.15),
    oee: Math.max(0, Math.min(100, jitter(running ? baseOee : baseOee - 9, 2.5))),
    history: [...m.history, powerKw].slice(-HISTORY_LEN),
  });
}

export function connectLiveTelemetry(): () => void {
  if (timer) clearInterval(timer);
  telemetryStore.getState().setConnected(true);
  console.log("[TELEMETRY] Canlı veri akışı bağlandı (mock WS, 1 Hz)");

  timer = setInterval(() => {
    // CTL-1: gerçek simülasyon durumundan
    const ctlState = machineStateStore.getState().state;
    push("CTL-1", ctlState === "IDLE" ? "IDLE" : "RUNNING", 46, 87);

    // SLT-1: yarma hattı sürekli çalışır (kendi iş kuyruğunu tüketir)
    push("SLT-1", "RUNNING", 74, 91);

    // LSR-2: kendi döngüsü LaserCell tarafından sürülür; sensörleri burada beslenir
    const lsr = telemetryStore.getState().machines["LSR-2"];
    push("LSR-2", lsr.status, 58, 83);
  }, 1000);

  return () => {
    if (timer) clearInterval(timer);
    timer = null;
    telemetryStore.getState().setConnected(false);
  };
}
