import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useStore } from "zustand";
import { Factory } from "./scenes/Factory";
import { MachineLine } from "./scenes/MachineLine";
import { SimulationController } from "./sim/SimulationController";
import { ProductionPlanHUD } from "./hud/ProductionPlanHUD";
import { QualityControls } from "./hud/QualityControls";
import { AssetManifestLoader } from "./assets/AssetLoader";
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
        {params.bloom && (
          <EffectComposer>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
            {params.vignette ? <Vignette offset={0.25} darkness={0.65} /> : <></>}
          </EffectComposer>
        )}
      </Canvas>
      <ProductionPlanHUD />
      <QualityControls />
    </div>
  );
}
