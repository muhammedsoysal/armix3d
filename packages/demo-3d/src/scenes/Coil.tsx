import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { COIL, LAYOUT, coilRadiusFor, simFrame } from "../sim/constants";
import { OptionalModel } from "../assets/AssetLoader";

/**
 * Rulo (decoiler). Placeholder primitiflerle — AssetLoader ile gerçek .glb'ye
 * geçiş Faz sonrası tek satır olacak. Yarıçap, beslenen sac uzunluğundan
 * fiziksel formülle türetilir; dönüş açısı çevre hızıyla senkrondur.
 */
export function Coil() {
  const spinRef = useRef<Group>(null!);
  const bodyRef = useRef<Mesh>(null!);

  useFrame(() => {
    const r = coilRadiusFor(simFrame.totalFedLength);
    const s = r / COIL.R0;
    bodyRef.current.scale.set(s, 1, s); // silindirin radyal eksenleri: lokal x/z
    spinRef.current.rotation.y = -simFrame.coilAngle;
  });

  return (
    <group position={[LAYOUT.coilX, LAYOUT.coilAxleY, 0]}>
      {/* Taşıyıcı ayaklar */}
      <OptionalModel name="decoiler-stand">
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[0, 0, side * (COIL.WIDTH / 2 + 0.09)]}>
            <mesh position={[0, -0.65, 0]} castShadow>
              <boxGeometry args={[1.05, 1.3, 0.14]} />
              <meshStandardMaterial color="#27548f" metalness={0.4} roughness={0.55} />
            </mesh>
            <mesh position={[0, -1.28, 0]}>
              <boxGeometry args={[1.5, 0.08, 0.5]} />
              <meshStandardMaterial color="#1d2027" metalness={0.5} roughness={0.6} />
            </mesh>
          </group>
        ))}
      </OptionalModel>

      {/* Dönen grup: rulo gövdesi + mil + tur işareti */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={spinRef}>
          <mesh ref={bodyRef} castShadow>
            <cylinderGeometry args={[COIL.R0, COIL.R0, COIL.WIDTH, 64]} />
            <meshStandardMaterial color="#aab1ba" metalness={0.92} roughness={0.28} />
            {/* Sargı ucu işareti — gövdenin çocuğu: radyal küçülmeyi devralır */}
            <mesh position={[COIL.R0 * 0.995, 0, 0]}>
              <boxGeometry args={[0.03, COIL.WIDTH + 0.01, 0.09]} />
              <meshStandardMaterial color="#4a5866" metalness={0.8} roughness={0.4} />
            </mesh>
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, COIL.WIDTH + 0.7, 24]} />
            <meshStandardMaterial color="#343941" metalness={0.7} roughness={0.45} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
