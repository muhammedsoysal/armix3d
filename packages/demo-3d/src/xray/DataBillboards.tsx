import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useStore } from "zustand";
import { machineStateStore, type MachineState } from "@metalnest/core";
import { COIL, LAYOUT, coilRadiusFor, simFrame } from "../sim/constants";
import { simStore, currentRecommendation } from "../sim/simStore";
import { xrayStore } from "./xrayStore";

const STATE_TR: Record<MachineState, string> = {
  IDLE: "BEKLEMEDE",
  FEEDING: "SAC BESLEME",
  CUTTING: "KESİM",
  LIFTING: "TRANSFER",
};

/** Tek satırlık holografik veri etiketi. */
function Tag({
  position,
  title,
  rows,
}: {
  position: [number, number, number];
  title: string;
  rows: [string, string][];
}) {
  return (
    <Html position={position} center distanceFactor={11} style={{ pointerEvents: "none" }}>
      <div className="rounded-lg border border-cyan-400/40 bg-cyan-950/70 px-3 py-2 font-mono shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-md">
        <div className="mb-1 border-b border-cyan-400/25 pb-1 text-[10px] font-bold tracking-[0.2em] text-cyan-300">
          {title}
        </div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-[10px] leading-4">
            <span className="text-cyan-500/80">{k}</span>
            <span className="font-semibold text-cyan-100">{v}</span>
          </div>
        ))}
      </div>
    </Html>
  );
}

/** X-ray modunda varlıkların üzerinde süzülen canlı veri etiketleri.
 * simFrame mutable olduğundan 500ms'lik poll ile örneklenir (HUD deseni). */
export function DataBillboards() {
  const active = useStore(xrayStore, (s) => s.active);
  const machineState = useStore(machineStateStore, (s) => s.state);
  const palletCount = useStore(simStore, (s) => s.palletStack.length);
  const completedCount = useStore(simStore, (s) => s.completedPallets.length);
  const totalPieces = useStore(simStore, (s) => s.totalPiecesCut);
  const [snap, setSnap] = useState({ coilPercent: 100, phasePct: 0, uptimeMin: 0 });

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const r = coilRadiusFor(simFrame.totalFedLength);
      setSnap({
        coilPercent: Math.round(((r - COIL.RMIN) / (COIL.R0 - COIL.RMIN)) * 100),
        phasePct: Math.round(simFrame.progress * 100),
        uptimeMin: Math.round((performance.now() / 60000) * 10) / 10,
      });
    }, 500);
    return () => clearInterval(id);
  }, [active]);

  // Basit OEE modeli (fuar verisi): kullanılabilirlik sabit yüksek, performans
  // kesim temposundan, kalite fire tahmininden türetilir — ERP'de gerçeğe bağlanır.
  const availability = 0.94;
  const performance_ = Math.min(1, 0.82 + 0.03 * Math.sin(totalPieces));
  const scrapNow = (currentRecommendation(simStore.getState())?.estimatedScrapPercent ?? 3) / 100;
  const quality = 1 - scrapNow;
  const oee = Math.round(availability * performance_ * quality * 100);
  // Enerji/CO₂: kesilen parça başına ~1.9 kWh, şebeke ~0.42 kgCO₂/kWh (mock)
  const kwh = Math.round(totalPieces * 1.9 * 10) / 10;
  const co2 = Math.round(kwh * 0.42 * 10) / 10;

  if (!active) return null;
  const rec = currentRecommendation(simStore.getState());

  return (
    <group>
      <Tag
        position={[LAYOUT.coilX, 3.1, 0]}
        title="AKTİF RULO"
        rows={[
          ["Doluluk", `%${snap.coilPercent}`],
          ["Ürün", rec?.sku ?? "—"],
        ]}
      />
      <Tag
        position={[LAYOUT.cutX, 3.3, 0]}
        title="CNC HAT 1"
        rows={[
          ["Durum", STATE_TR[machineState]],
          ["Faz", `%${snap.phasePct}`],
          ["OEE", `%${oee}`],
          ["Çalışma", `${snap.uptimeMin} dk`],
        ]}
      />
      <Tag
        position={[-2, 2.9, 3.5]}
        title="ENERJİ & KARBON"
        rows={[
          ["Tüketim", `${kwh} kWh`],
          ["Karbon", `${co2} kg CO₂`],
          ["Ton başına", `${totalPieces > 0 ? Math.round((kwh / Math.max(totalPieces * 0.011, 0.01)) * 10) / 10 : 0} kWh/t`],
        ]}
      />
      <Tag
        position={[LAYOUT.palletX, 2.4, 0]}
        title="AKTİF PALET"
        rows={[
          ["Doluluk", `${palletCount}/5`],
          ["Stok Sahası", `${completedCount} palet`],
        ]}
      />
    </group>
  );
}
