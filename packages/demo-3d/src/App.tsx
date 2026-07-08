import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useStore } from "zustand";
import { Factory } from "./scenes/Factory";
import { MachineLine } from "./scenes/MachineLine";
import { SimulationController } from "./sim/SimulationController";
import { ProductionPlanHUD } from "./hud/ProductionPlanHUD";
import { QualityControls } from "./hud/QualityControls";
import { AssetManifestLoader } from "./assets/AssetLoader";
import { PostFX } from "./fx/PostFX";
import { DirectorCamera } from "./director/DirectorCamera";
import { XRayEffect } from "./xray/XRayEffect";
import { DataPipelines } from "./xray/DataPipelines";
import { DataBillboards } from "./xray/DataBillboards";
import { OptimizerThinkingHUD } from "./hud/OptimizerThinkingHUD";
import { WhatIfHUD } from "./hud/WhatIfHUD";
import { AudioToggle } from "./hud/AudioToggle";
import { FactoryAudio } from "./audio/FactoryAudio";
import { FactoryDashboard } from "./hud/FactoryDashboard";
import { TraceabilityHUD } from "./hud/TraceabilityHUD";
import { ShiftReport } from "./hud/ShiftReport";
import { Toolbar } from "./hud/Toolbar";
import { AlarmBanner } from "./alarm/AlarmBanner";
import { GanttView } from "./hud/GanttView";
import { Splash, Onboarding, introStore } from "./hud/Splash";
import { connectLiveTelemetry } from "./telemetry/liveTelemetryService";
import { DirectorHUD } from "./hud/DirectorHUD";
import { directorStore } from "./director/directorStore";
import { qualityStore } from "./quality/qualityStore";
import { OrderEntryHUD } from "./hud/OrderEntryHUD";
import { MiniMap } from "./hud/MiniMap";
import { ShiftBadge } from "./hud/ShiftBadge";
import { IS_KIOSK } from "./kiosk/kiosk";

export default function App() {
  const params = useStore(qualityStore, (s) => s.params);
  const directorActive = useStore(directorStore, (s) => s.active);

  // Canlı telemetri akışı (mock WS) — gerçek entegrasyonda SCADA/ERP ucu
  useEffect(() => connectLiveTelemetry(), []);

  // Kiosk bekçisi: intro biter bitmez Sunum Modu açılır; biri kapatırsa
  // (veya kadraj kesintisi sonrası) 5 sn'de bir yeniden devreye alınır
  useEffect(() => {
    if (!IS_KIOSK) return;
    console.log("[KIOSK] Fuar vitrini modu — UI kilitli, Sunum Modu otopilot");
    const id = setInterval(() => {
      if (introStore.getState().phase === "done" && !directorStore.getState().active) {
        directorStore.getState().activate();
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full">
      <AssetManifestLoader />
      <Canvas
        shadows
        dpr={[1, params.dprMax]}
        camera={{ position: [4.5, 4, 9.5], fov: 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {/* flipflops=2: sınırda gezen makine sürekli kalite değiştirip durmasın.
            stepDown localStorage'a yazmaz — anlık yavaşlama kalıcı düşürme yapmaz. */}
        <PerformanceMonitor flipflops={2} onDecline={() => {
            // Açılış/iniş sırasındaki shader derleme takılmaları kalite
            // kararı DEĞİLDİR — intro bitmeden düşürme yapma
            if (introStore.getState().phase === "done") qualityStore.getState().stepDown();
          }}>
          <Factory />
          <MachineLine />
          <SimulationController />
          <DirectorCamera />
          <FactoryAudio />
          <XRayEffect />
          <DataPipelines />
          <DataBillboards />
          <PostFX />
        </PerformanceMonitor>
      </Canvas>
      {/* Sunum modunda paneller sinematik kadraja yer açmak için söner */}
      <div className={`transition-opacity duration-700 ${directorActive ? "opacity-30" : "opacity-100"}`}>
        <ProductionPlanHUD />
        {!IS_KIOSK && <QualityControls />}
      </div>
      <DirectorHUD />
      <OptimizerThinkingHUD />
      {!IS_KIOSK && (
        <>
          <WhatIfHUD />
          <OrderEntryHUD />
          <AudioToggle />
          <FactoryDashboard />
          <Toolbar />
          <GanttView />
          <TraceabilityHUD />
          <ShiftReport />
        </>
      )}
      <AlarmBanner />
      <ShiftBadge />
      <MiniMap />
      <Splash />
      <Onboarding />
    </div>
  );
}
