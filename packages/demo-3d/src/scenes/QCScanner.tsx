import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, simFrame } from "../sim/constants";

/** Kalite kontrol kemeri: çıkış masasının üzerinde duran tarayıcı çerçeve.
 * LIFTING sırasında (parça masadan alınırken) yeşil lazer düzlemi parçayı
 * boydan boya süpürür — kalınlık/yüzey kontrolü hissi. */
export function QCScanner() {
  const planeRef = useRef<Mesh>(null!);
  const lampRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const scanning = machineStateStore.getState().state === "LIFTING" && simFrame.progress < 0.55;
    planeRef.current.visible = scanning;
    if (scanning) {
      // Tarama düzlemi parça boyunca ileri-geri süpürür
      const sweep = Math.sin(simFrame.progress * Math.PI * 5.5) * 0.5 + 0.5;
      planeRef.current.position.x = -0.55 + sweep * 1.1;
      (planeRef.current.material as MeshBasicMaterial).opacity = 0.35 + 0.2 * Math.sin(clock.elapsedTime * 30);
    }
    const lampMat = lampRef.current.material as MeshBasicMaterial;
    lampMat.color.set(scanning ? "#22c55e" : "#155e2b");
  });

  return (
    <group position={[LAYOUT.cutX + 0.7, 0, 0]}>
      {/* Kemer çerçevesi */}
      {([-0.95, 0.95] as const).map((z) => (
        <mesh key={z} position={[0, 0.95, z]} castShadow>
          <boxGeometry args={[0.1, 1.9, 0.1]} />
          <meshStandardMaterial color="#0e7490" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 1.86, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 2.0]} />
        <meshStandardMaterial color="#0e7490" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Sensör kafaları */}
      {([-0.4, 0, 0.4] as const).map((z) => (
        <mesh key={z} position={[0, 1.76, z]}>
          <boxGeometry args={[0.08, 0.08, 0.14]} />
          <meshStandardMaterial color="#10151c" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* Durum lambası */}
      <mesh ref={lampRef} position={[0, 1.96, 0]} userData={{ noXray: true }}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshBasicMaterial color="#155e2b" toneMapped={false} />
      </mesh>
      {/* Tarama düzlemi — additive yeşil ışık perdesi */}
      <mesh
        ref={planeRef}
        position={[0, (LAYOUT.tableY + 1.72) / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        visible={false}
        userData={{ noXray: true }}
      >
        <planeGeometry args={[LAYOUT.sheetWidth + 0.1, 1.72 - LAYOUT.tableY]} />
        <meshBasicMaterial
          color="#4ade80"
          transparent
          opacity={0.4}
          blending={AdditiveBlending}
          side={DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
