import { Environment, Grid, Lightformer } from "@react-three/drei";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";

/** Fabrika ortamı: zemin, sis, ışıklar ve prosedürel environment map
 * (dosya/network bağımlılığı yok — fuar makinesi offline çalışabilir).
 * Gölge çözünürlüğü ve env-map boyutu kalite ayarından gelir. */
export function Factory() {
  const params = useStore(qualityStore, (s) => s.params);

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
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
        <Lightformer intensity={0.8} color="#8fb7ff" position={[-6, 3, -6]} scale={[5, 2, 1]} />
        <Lightformer intensity={0.6} color="#ffd0a3" position={[6, 2, 6]} rotation-y={Math.PI} scale={[5, 2, 1]} />
      </Environment>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#13161c" roughness={0.92} metalness={0.05} />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        infiniteGrid
        cellSize={0.5}
        sectionSize={2.5}
        cellColor="#232a38"
        sectionColor="#33405c"
        fadeDistance={38}
      />
    </>
  );
}
