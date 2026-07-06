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
import { qualityStore } from "./quality/qualityStore";

export default function App() {
  const params = useStore(qualityStore, (s) => s.params);

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
          <PostFX />
        </PerformanceMonitor>
      </Canvas>
      <ProductionPlanHUD />
      <QualityControls />
    </div>
  );
}
