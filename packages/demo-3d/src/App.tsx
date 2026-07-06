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
import { XRayToggle } from "./hud/XRayToggle";
import { OptimizerThinkingHUD } from "./hud/OptimizerThinkingHUD";
import { WhatIfHUD } from "./hud/WhatIfHUD";
import { DirectorHUD } from "./hud/DirectorHUD";
import { directorStore } from "./director/directorStore";
import { qualityStore } from "./quality/qualityStore";

export default function App() {
  const params = useStore(qualityStore, (s) => s.params);
  const directorActive = useStore(directorStore, (s) => s.active);

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
        <PerformanceMonitor flipflops={2} onDecline={() => qualityStore.getState().stepDown()}>
          <Factory />
          <MachineLine />
          <SimulationController />
          <DirectorCamera />
          <XRayEffect />
          <DataPipelines />
          <DataBillboards />
          <PostFX />
        </PerformanceMonitor>
      </Canvas>
      {/* Sunum modunda paneller sinematik kadraja yer açmak için söner */}
      <div className={`transition-opacity duration-700 ${directorActive ? "opacity-30" : "opacity-100"}`}>
        <ProductionPlanHUD />
        <QualityControls />
      </div>
      <DirectorHUD />
      <XRayToggle />
      <OptimizerThinkingHUD />
      <WhatIfHUD />
    </div>
  );
}
