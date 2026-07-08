import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial, type PointLight } from "three";

/** Boru Lazer Kesim Hattı — uzun yatak boyunca dönen çelik boru, kızak
 * üzerinde kayan lazer kafası ve kesim anında cyan flaş. Çıkış tarafında
 * kesilmiş boru rafı. Doğu kanadının "uzun makine" silüeti. */

const BED = "#252c36";
const DARK = "#1c1f24";
const TUBE = "#aeb6c2";
const LEN = 10.5; // yatak uzunluğu (x lokal)

export function TubeLaser({ position = [33, 0, 6] as [number, number, number] }) {
  const tubeRef = useRef<Mesh>(null!);
  const headRef = useRef<Group>(null!);
  const flashRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Boru sürekli döner; kafa 14 sn'lik çevrimde yatak boyunca ilerler
    tubeRef.current.rotation.x = t * 2.2;
    const cyc = (t % 14) / 14;
    const cutting = cyc < 0.82; // son %18: hızlı geri dönüş
    const u = cutting ? cyc / 0.82 : 1 - (cyc - 0.82) / 0.18;
    headRef.current.position.x = -LEN / 2 + 1.2 + u * (LEN - 2.8);
    const flick = cutting ? 0.55 + 0.45 * Math.sin(t * 43) * Math.sin(t * 13.7) : 0;
    (flashRef.current.material as MeshBasicMaterial).opacity = Math.max(0, flick);
    lightRef.current.intensity = Math.max(0, flick) * 14;
  });

  return (
    <group position={position}>
      {/* Ana yatak */}
      <RoundedBox args={[LEN, 0.85, 1.5]} radius={0.06} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={BED} metalness={0.55} roughness={0.45} />
      </RoundedBox>
      {/* Kızak rayı */}
      <mesh position={[0, 0.92, 0.55]} castShadow>
        <boxGeometry args={[LEN - 0.4, 0.08, 0.12]} />
        <meshStandardMaterial color="#8a94a2" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Ayna (chuck) — giriş ucu */}
      <mesh position={[-LEN / 2 + 0.5, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.5, 18]} />
        <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Dönen çelik boru — yatak boyunca */}
      <mesh ref={tubeRef} position={[0.6, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, LEN - 1.6, 12]} />
        <meshStandardMaterial color={TUBE} metalness={0.9} roughness={0.28} />
      </mesh>
      {/* Lazer kafası kızağı */}
      <group ref={headRef} position={[0, 0, 0]}>
        <RoundedBox args={[0.55, 0.75, 1.0] as [number, number, number]} radius={0.05} smoothness={3} position={[0, 1.45, 0.2]} castShadow>
          <meshStandardMaterial color="#37404c" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 1.32, -0.12]} rotation={[0.35, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.035, 0.4, 10]} />
          <meshStandardMaterial color="#22d3ee" metalness={0.6} roughness={0.2} emissive="#0e7490" emissiveIntensity={0.5} />
        </mesh>
        {/* Kesim flaşı */}
        <mesh ref={flashRef} position={[0, 1.15, 0]} userData={{ noXray: true }}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight ref={lightRef} position={[0, 1.15, 0]} color="#22d3ee" intensity={0} distance={7} decay={2} />
      </group>
      {/* Çıkış rafı — kesilmiş borular */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[0, 0.35, 0]} rotation={[0.12, 0, 0]} receiveShadow>
          <boxGeometry args={[LEN - 2, 0.08, 1.1]} />
          <meshStandardMaterial color="#2b323c" metalness={0.5} roughness={0.55} />
        </mesh>
        {[-0.28, 0, 0.28].map((dz, i) => (
          <mesh key={i} position={[-(i - 1) * 0.6, 0.5 + i * 0.02, dz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, LEN - 3, 10]} />
            <meshStandardMaterial color={TUBE} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* Neon taban — cyan imza */}
      <mesh position={[0, 0.012, -0.2]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
        <planeGeometry args={[LEN + 0.8, 4.4]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
