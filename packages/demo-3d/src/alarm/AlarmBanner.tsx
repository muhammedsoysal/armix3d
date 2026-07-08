import { useEffect } from "react";
import { useStore } from "zustand";
import { alarmStore } from "./alarmStore";

const NOTES = [
  "Bıçak sıcaklığı eşik üstü — soğutma bekleniyor",
  "Titreşim anomalisi — rulman kontrolü",
  "Servo sürücü aşırı akım — resetleniyor",
];

/** Alarm yönetmeni + üst uyarı bandı: ~100 sn'de bir rastgele arıza senaryosu
 * tetikler (yalnız üretim sürerken), 12 sn sonra otomatik çözülür.
 * Kestirimci bakım anlatısının canlı draması. */
export function AlarmBanner() {
  const active = useStore(alarmStore, (s) => s.active);
  const note = useStore(alarmStore, (s) => s.note);
  const machineId = useStore(alarmStore, (s) => s.machineId);

  useEffect(() => {
    const id = setInterval(() => {
      const s = alarmStore.getState();
      if (!s.active && Math.random() < 0.12) {
        s.trigger("CTL-1", NOTES[Math.floor(Math.random() * NOTES.length)]);
      }
    }, 12_000); // beklenen ~100 sn'de bir alarm
    return () => clearInterval(id);
  }, []);

  if (!active) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-red-500/60 bg-red-950/90 px-5 py-2.5 shadow-[0_0_30px_rgba(239,68,68,0.4)] backdrop-blur-xl">
        <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
        <span className="text-[11px] font-bold tracking-widest text-red-300">ALARM · {machineId}</span>
        <span className="h-4 w-px bg-red-400/30" />
        <span className="text-xs text-red-100">{note}</span>
        <span className="font-mono text-[10px] text-red-400/70">operatör müdahale ediyor…</span>
      </div>
    </div>
  );
}
