import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Mesh, type MeshStandardMaterial } from "three";
import { STAGING } from "../agv/agvLogic";
import { agvStore } from "../agv/agvStore";
import { OptionalModel } from "../assets/AssetLoader";

/** Bantlama/Paketleme istasyonu: istasyon kemeri STAGING noktasının üzerinde
 * durur; dolu palet gelince uygulayıcı kol iner-kalkar (çemberleme), lamba
 * amber yanar. Palet görselindeki çemberler PalletWithStack `banded` ile gelir. */
export function BandingStation() {
  const armRef = useRef<Group>(null!);
  const lampRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const pending = agvStore.getState().pending;
    // Bantlama penceresi: palet istasyonda ve AGV henüz almaya hak kazanmadı
    const banding = pending.length > 0 && Date.now() < pending[0].readyAt;
    const t = clock.elapsedTime;
    // Kol: bantlama sırasında iki inişli çevrim; boşta yukarıda park
    armRef.current.position.y = banding ? 1.05 - 0.38 * Math.abs(Math.sin(t * 2.6)) : 1.05;
    const mat = lampRef.current.material as MeshStandardMaterial;
    mat.emissive.set(banding ? "#f59e0b" : "#16a34a");
    mat.emissiveIntensity = banding ? 2.5 + 1.5 * Math.sin(t * 10) : 1.4;
  });

  return (
    <group position={[STAGING.x, 0, STAGING.z]}>
      <OptionalModel name="banding-station">
        {/* Kemer: iki kolon + köprü */}
        {([-0.85, 0.85] as const).map((z) => (
          <mesh key={z} position={[0, 0.75, z]} castShadow>
            <boxGeometry args={[0.18, 1.5, 0.16]} />
            <meshStandardMaterial color="#7c3aed" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.44, 0]} castShadow>
          <boxGeometry args={[0.22, 0.14, 1.86]} />
          <meshStandardMaterial color="#6d28d9" metalness={0.5} roughness={0.45} />
        </mesh>
        {/* Uygulayıcı kol (çemberleme kafası) */}
        <group ref={armRef} position={[0, 1.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.1, 1.3]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
        {/* Durum lambası */}
        <mesh ref={lampRef} position={[0, 1.58, 0.8]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshStandardMaterial color="#052e12" emissive="#16a34a" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </OptionalModel>
    </group>
  );
}
