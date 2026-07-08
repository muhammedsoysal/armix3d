import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Mesh, type MeshStandardMaterial } from "three";
import { OptionalModel } from "../assets/AssetLoader";

/** PRS-1 Abkant Pres — Kenney Factory Kit GLB gövde (CC0) + prosedürel
 * inen koç (ram): GLB statik, hareket bizim; hibrit desenin ders kitabı. */
const CYCLE = 6.5;

export function PressBrake({ position = [-1.8, 0, -2.4] as [number, number, number] }) {
  const ramRef = useRef<Group>(null!);
  const lampRef = useRef<Mesh>(null!);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime % CYCLE;
    // 0-1.2 in, 1.2-1.8 bas, 1.8-3 çık, kalan bekle
    const down =
      t < 1.2 ? t / 1.2 : t < 1.8 ? 1 : t < 3 ? 1 - (t - 1.8) / 1.2 : 0;
    ramRef.current.position.y = 1.55 - down * 0.55;
    const mat = lampRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = down > 0.9 ? 4 : 1.2 + Math.sin(clock.elapsedTime * 4) * 0.4;
    void dt;
  });

  return (
    <group position={position} rotation={[0, 0.35, 0]}>
      <OptionalModel name="press-brake">
        {/* Fallback: basit C-çerçeve pres */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.6, 1.8, 0.8]} />
          <meshStandardMaterial color="#31527d" metalness={0.5} roughness={0.5} />
        </mesh>
      </OptionalModel>
      {/* Prosedürel koç — GLB'nin önünde iner/kalkar */}
      <group ref={ramRef} position={[0, 1.55, 0.62]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.22, 0.14]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[1.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#8b939d" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
      {/* Alt kalıp + iş parçası */}
      <mesh position={[0, 0.62, 0.62]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.18]} />
        <meshStandardMaterial color="#1c2128" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0.62]}>
        <boxGeometry args={[1.1, 0.015, 0.3]} />
        <meshStandardMaterial color="#c9ced5" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh ref={lampRef} position={[0.7, 2.1, 0.3]} userData={{ noXray: true }}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial color="#3b0764" emissive="#f59e0b" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Hat konveyörleri — Kenney conveyor-long GLB, pres↔lazer arasında köprü. */
export function Conveyors() {
  return (
    <group>
      {[[0.4, -2.6, 0.12], [1.7, -2.75, 0.08]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r as number, 0]}>
          <OptionalModel name="conveyor">
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[1.4, 0.14, 0.5]} />
              <meshStandardMaterial color="#3a424c" metalness={0.6} roughness={0.45} />
            </mesh>
          </OptionalModel>
        </group>
      ))}
    </group>
  );
}
