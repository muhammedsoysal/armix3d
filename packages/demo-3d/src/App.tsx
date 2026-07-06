import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useStore } from "zustand";
import { Factory } from "./scenes/Factory";
import { MachineLine } from "./scenes/MachineLine";
import { SimulationController } from "./sim/SimulationController";
import { ProductionPlanHUD } from "./hud/ProductionPlanHUD";
import { QualityControls } from "./hud/QualityControls";
import { AssetManifestLoader } from "./assets/AssetLoader";
import { PostFX } from "./fx/PostFX";
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
        <Factory />
        <MachineLine />
        <SimulationController />
        <OrbitControls
          makeDefault
          target={[-0.8, 1, 0]}
          minDistance={4}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.05}
        />
        <PostFX />
      </Canvas>
      <ProductionPlanHUD />
      <QualityControls />
    </div>
  );
}
