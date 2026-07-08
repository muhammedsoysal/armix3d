import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial, type PointLight } from "three";

/** Plazma Kesim — geniş portal (gantry) makine: su yataklı kesim masası,
 * masa boyunca yürüyen köprü ve köprü üzerinde gezen torç. Torçtan yoğun
 * mavi-beyaz plazma alevi (koni + additive çekirdek + güçlü ışık). */

const W = 9.0; // masa genişliği (x lokal)
const D = 4.2; // masa derinliği (z lokal)
const STEEL = "#39424e";

export function PlasmaCutter({ position = [-41, 0, -8] as [number, number, number] }) {
  const gantryRef = useRef<Group>(null!);
  const torchRef = useRef<Group>(null!);
  const flameRef = useRef<Mesh>(null!);
  const coreRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Köprü x boyunca yavaş tarama (18 sn ping-pong), torç z boyunca hızlı
    const gx = Math.sin(t * (Math.PI / 9)) * (W / 2 - 1.2);
    gantryRef.current.position.x = gx;
    torchRef.current.position.z = Math.sin(t * 0.9) * (D / 2 - 0.7);
    // Plazma alevi: neredeyse sürekli, sert yüksek frekans titreme
    const flick = 0.6 + 0.4 * Math.sin(t * 47) * Math.sin(t * 19.3);
    (flameRef.current.material as MeshBasicMaterial).opacity = 0.5 * flick;
    (coreRef.current.material as MeshBasicMaterial).opacity = 0.95 * flick;
    lightRef.current.intensity = 30 * flick;
  });

  return (
    <group position={position}>
      {/* Su yataklı kesim masası */}
      <RoundedBox args={[W, 0.7, D]} radius={0.06} smoothness={3} position={[0, 0.38, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#252c36" metalness={0.55} roughness={0.45} />
      </RoundedBox>
      {/* Masa üstü: koyu su + ızgara çıtaları */}
      <mesh position={[0, 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.5, D - 0.5]} />
        <meshStandardMaterial color="#0a1016" metalness={0.3} roughness={0.2} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => -W / 2 + 0.8 + i * ((W - 1.6) / 10)).map((x) => (
        <mesh key={x} position={[x, 0.76, 0]}>
          <boxGeometry args={[0.05, 0.05, D - 0.6]} />
          <meshStandardMaterial color="#4a5560" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* Kesilen sac plakası */}
      <mesh position={[0.4, 0.79, 0.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[W - 2.4, D - 1.6]} />
        <meshStandardMaterial color="#8a94a2" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Yan raylar */}
      {([-D / 2 - 0.35, D / 2 + 0.35] as const).map((z) => (
        <mesh key={z} position={[0, 0.55, z]} castShadow>
          <boxGeometry args={[W + 0.6, 0.22, 0.3]} />
          <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* PORTAL KÖPRÜ — x boyunca yürür */}
      <group ref={gantryRef}>
        {([-D / 2 - 0.35, D / 2 + 0.35] as const).map((z) => (
          <RoundedBox key={z} args={[0.55, 1.5, 0.5]} radius={0.05} smoothness={3} position={[0, 1.1, z]} castShadow>
            <meshStandardMaterial color="#37404c" metalness={0.6} roughness={0.35} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.6, 0.5, D + 1.4]} radius={0.06} smoothness={3} position={[0, 1.95, 0]} castShadow>
          <meshStandardMaterial color="#37404c" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        {/* Köprü kenar neonu */}
        <mesh position={[0, 2.22, 0]} userData={{ noXray: true }}>
          <boxGeometry args={[0.04, 0.03, D + 1.2]} />
          <meshBasicMaterial color="#60a5fa" toneMapped={false} />
        </mesh>
        {/* TORÇ — z boyunca gezer */}
        <group ref={torchRef}>
          <RoundedBox args={[0.45, 0.6, 0.45]} radius={0.05} smoothness={3} position={[0, 1.6, 0]} castShadow>
            <meshStandardMaterial color="#20262e" metalness={0.6} roughness={0.35} />
          </RoundedBox>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.035, 0.5, 10]} />
            <meshStandardMaterial color="#8a94a2" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Plazma alevi: dış koni + beyaz çekirdek + güçlü ışık */}
          <mesh ref={flameRef} position={[0, 0.92, 0]} userData={{ noXray: true }}>
            <coneGeometry args={[0.09, 0.32, 10, 1, true]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh ref={coreRef} position={[0, 0.86, 0]} userData={{ noXray: true }}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshBasicMaterial color="#eff6ff" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <pointLight ref={lightRef} position={[0, 0.9, 0]} color="#7ab8ff" intensity={0} distance={11} decay={2} />
        </group>
      </group>
      {/* Operatör konsolu */}
      <group position={[-W / 2 - 1.0, 0, D / 2 + 0.6]} rotation={[0, 0.6, 0]}>
        <RoundedBox args={[0.7, 1.25, 0.5]} radius={0.05} smoothness={3} position={[0, 0.62, 0]} castShadow>
          <meshStandardMaterial color="#252c36" metalness={0.5} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 1.12, 0.2]} rotation={[-0.5, 0, 0]} userData={{ noXray: true }}>
          <planeGeometry args={[0.55, 0.35]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      </group>
      {/* Neon taban — plazma mavisi */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
        <planeGeometry args={[W + 1.6, D + 2.4]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.055} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
