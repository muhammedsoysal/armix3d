import { Environment, Grid, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";
import { xrayStore } from "../xray/xrayStore";
import { VolumetricShafts } from "./VolumetricShafts";
import { FactoryBuilding } from "./FactoryBuilding";

/** Fabrika ortamı: zemin, sis, ışıklar ve prosedürel environment map
 * (dosya/network bağımlılığı yok — fuar makinesi offline çalışabilir).
 * Gölge çözünürlüğü ve env-map boyutu kalite ayarından gelir. */
export function Factory() {
  const params = useStore(qualityStore, (s) => s.params);
  const xrayActive = useStore(xrayStore, (s) => s.active);

  return (
    <>
      <color attach="background" args={["#07090d"]} />
      <fog attach="fog" args={["#07090d", 18, 48]} />

      <ambientLight intensity={0.25} />
      {/* key: gölge haritası boyutu değişince ışık yeniden kurulur (eski map dispose edilir) */}
      <directionalLight
        key={`sun-${params.shadowMapSize}-${params.shadowsEnabled}`}
        position={[6, 12, 5]}
        intensity={1.6}
        castShadow={params.shadowsEnabled}
        shadow-mapSize={[params.shadowMapSize, params.shadowMapSize]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <spotLight position={[-8, 6, 6]} angle={0.5} penumbra={0.8} intensity={40} color="#6fa8ff" />
      <spotLight position={[5, 5, -6]} angle={0.6} penumbra={0.9} intensity={25} color="#ffb36b" />

      <Environment key={`env-${params.envResolution}`} resolution={params.envResolution}>
        <Lightformer intensity={1.9} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
        <Lightformer intensity={0.9} color="#8fb7ff" position={[-6, 3, -6]} scale={[5, 2, 1]} />
        <Lightformer intensity={0.7} color="#ffd0a3" position={[6, 2, 6]} rotation-y={Math.PI} scale={[5, 2, 1]} />
        {/* Yan şerit ışıklar: metal yüzeylerde uzun speküler yansıma çizgileri */}
        <Lightformer intensity={0.55} color="#dfe9ff" position={[0, 4, 8]} rotation-x={0.4} scale={[14, 0.8, 1]} />
        <Lightformer intensity={0.45} color="#cfd8ff" position={[-8, 2.5, 0]} rotation-y={Math.PI / 2} scale={[10, 0.6, 1]} />
      </Environment>

      <VolumetricShafts />
      <FactoryBuilding />

      {/* Zemin: orta/ultra kalitede cilalı beton yansıması (AAA görünümün
          bel kemiği) — düşük kalitede standart mat zemin.
          X-Ray'de KAPALI: reflektör sahneyi ikinci kez render eder; hologram
          süpürmesiyle birleşince FPS çöküyordu, ayrıca şematik dünyada
          fotogerçekçi yansıma görsel olarak da yanlış. */}
      {params.bloom && !xrayActive ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ noXray: true }}>
          <planeGeometry args={[90, 90]} />
          <MeshReflectorMaterial
            resolution={params.envResolution >= 256 ? 1024 : 512}
            blur={[300, 80]}
            mixBlur={0.85}
            mixStrength={2.2}
            mirror={0.55}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#101319"
            roughness={0.8}
            metalness={0.35}
          />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[90, 90]} />
          <meshStandardMaterial color="#13161c" roughness={0.92} metalness={0.05} />
        </mesh>
      )}
      <Grid
        /* noXray: drei Grid kendi shader uniform'larını her kare günceller;
           hologram swap'ı onu kırar — zaten TRON dünyasının grid'i budur */
        userData={{ noXray: true }}
        position={[0, 0.005, 0]}
        infiniteGrid
        cellSize={0.5}
        sectionSize={2.5}
        cellColor="#232a38"
        sectionColor="#33405c"
        fadeDistance={95}
      />
    </>
  );
}
