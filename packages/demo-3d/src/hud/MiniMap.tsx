import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { getPoses } from "../fleet/poseRegistry";
import { telemetryStore, type MachineStatus } from "../telemetry/telemetryStore";
import { alarmStore } from "../alarm/alarmStore";
import { introStore } from "./Splash";
import { PLANT } from "../sim/constants";

/** Dünya sınırları — PLANT tek kaynağından: zarf büyüyünce harita
 * OTOMATİK ölçeklenir (FactoryBuilding ile aynı sabit). */
const X0 = PLANT.x0, X1 = PLANT.x1, Z0 = PLANT.z0, Z1 = PLANT.z1;
const SCALE = 3.2; // px/m — 100×60 m'de 320×192 px panel
const W = (X1 - X0) * SCALE;
const H = (Z1 - Z0) * SCALE;

const px = (x: number) => (x - X0) * SCALE;
/** Harita yukarısı = -z (kuzey): ekran kamera bakışıyla hizalı */
const py = (z: number) => (Z1 - z) * SCALE;

function rect(c: CanvasRenderingContext2D, x0: number, z0: number, x1: number, z1: number) {
  c.rect(px(x0), py(z1), (x1 - x0) * SCALE, (z1 - z0) * SCALE);
}

/** Mini-Harita — sağ-alt cam panelde 2D radar: bina, bölgeler, makineler
 * ve CANLI araç pozları (poseRegistry, 10 Hz). Canvas'a çizilir; react
 * render'ı tetiklenmez — 60 FPS bütçesine dokunmaz. */
export function MiniMap() {
  const phase = useStore(introStore, (s) => s.phase);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== "done") return;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    let tick = 0;

    const draw = () => {
      tick++;
      c.clearRect(0, 0, W, H);

      // Bina zarfı
      c.strokeStyle = "rgba(148,163,184,0.45)";
      c.lineWidth = 1;
      c.beginPath();
      rect(c, X0 + 0.5, Z0 + 0.5, X1 - 0.5, Z1 - 0.5);
      c.stroke();

      // Bölgeler (soluk dolgu): rulo sahası, FG deposu, dok + yeni departmanlar
      c.fillStyle = "rgba(56,189,248,0.07)";
      c.beginPath();
      rect(c, -19.5, -17.5, -5.5, -6.5); // B1 — rulo sahası
      c.fill();
      c.fillStyle = "rgba(74,122,90,0.12)";
      c.beginPath();
      rect(c, 10, -11.5, 15.8, 0.6); // FG deposu
      c.fill();
      c.fillStyle = "rgba(234,179,8,0.10)";
      c.beginPath();
      rect(c, 13.6, -2.4, 16.6, 2.4); // sevkiyat dokı
      c.fill();
      c.fillStyle = "rgba(245,158,11,0.08)";
      c.beginPath();
      rect(c, 22.2, -17.2, 35.8, -9.6); // D1 kaynak
      c.fill();
      c.fillStyle = "rgba(34,211,238,0.07)";
      c.beginPath();
      rect(c, 26, 2.6, 40, 8.6); // D2 boru lazer
      c.fill();
      c.fillStyle = "rgba(59,130,246,0.09)";
      c.beginPath();
      rect(c, -47.2, -12.2, -34.8, -3.8); // E1 plazma
      c.fill();
      c.fillStyle = "rgba(167,139,250,0.09)";
      c.beginPath();
      rect(c, -6.8, -27.3, 10.8, -21.7); // F1 toz boya
      c.fill();

      // Makine durum işaretleri — canlı telemetri rengi (alarmda flaş)
      const machines = telemetryStore.getState().machines;
      const alarmed = alarmStore.getState().active;
      const flash = alarmed && tick % 8 < 4;
      const statusFill = (st: MachineStatus | undefined, isCtl: boolean) =>
        (isCtl && flash) || st === "ALARM"
          ? "rgba(239,68,68,0.8)"
          : st === "RUNNING"
            ? "rgba(52,211,153,0.65)"
            : "rgba(251,191,36,0.55)";
      const MACHINE_RECTS: [string, number, number, number, number][] = [
        ["CTL-1", -9.4, -0.9, 6.4, 0.9],
        ["WLD-1", 24, -16, 34, -12],
        ["TBL-1", 27.5, 4.5, 38.5, 7.5],
        ["PLZ-1", -45.5, -10.5, -36.5, -5.5],
        ["PWD-1", -5, -25.8, 9, -23.2],
      ];
      for (const [id, x0, zz0, x1, zz1] of MACHINE_RECTS) {
        c.fillStyle = statusFill(machines[id]?.status, id === "CTL-1");
        c.beginPath();
        rect(c, x0, zz0, x1, zz1);
        c.fill();
      }

      // Şarj istasyonu
      c.fillStyle = "rgba(34,197,94,0.8)";
      c.beginPath();
      c.arc(px(8.2), py(3.2), 2, 0, Math.PI * 2);
      c.fill();

      // Araçlar — canlı pozlar (heading çizgisi yön belirtir)
      for (const [id, p] of getPoses()) {
        const cx = px(p.x), cy = py(p.z);
        c.fillStyle = p.kind === "forklift" ? "#f59e0b" : "#22d3ee";
        c.beginPath();
        c.arc(cx, cy, 2.6, 0, Math.PI * 2);
        c.fill();
        // heading: 0 = +z (haritada aşağı) → ekran açısı
        const dx = Math.sin(p.heading), dz = Math.cos(p.heading);
        c.strokeStyle = c.fillStyle as string;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + dx * 6, cy - dz * 6);
        c.stroke();
        c.fillStyle = "rgba(226,232,240,0.75)";
        c.font = "600 6.5px ui-monospace, monospace";
        c.fillText(id, cx + 4, cy - 3);
      }
    };

    draw();
    const id = setInterval(draw, 100); // 10 Hz — radar hissi, ucuz
    return () => clearInterval(id);
  }, [phase]);

  if (phase !== "done") return null;
  return (
    <div className="pointer-events-none absolute bottom-24 right-6 z-30 rounded-2xl border border-white/10 bg-black/55 p-2.5 backdrop-blur-md">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-[0.25em] text-cyan-300">MİNİ HARİTA</span>
        <span className="font-mono text-[8px] tabular-nums text-slate-500">CANLI · 10 Hz</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: W, height: H }} className="rounded-lg bg-slate-950/80" />
      <div className="mt-1.5 flex items-center gap-3 font-mono text-[8px] text-slate-400">
        <span><span className="text-cyan-300">●</span> AGV</span>
        <span><span className="text-amber-400">●</span> Forklift</span>
        <span><span className="text-emerald-400">▬</span> Çalışan hat</span>
        <span><span className="text-amber-300">▬</span> Bekleyen</span>
      </div>
    </div>
  );
}
