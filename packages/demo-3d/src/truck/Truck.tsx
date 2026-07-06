import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Mesh } from "three";
import { useStore } from "zustand";
import { simStore } from "../sim/simStore";
import { PalletWithStack } from "../scenes/Pallet";
import { OptionalModel } from "../assets/AssetLoader";
import { truckStore } from "./truckStore";

/** Kamyon park konumu (dünya) — +z yönüne bakar, kalkışta +z'ye sürer. */
export const TRUCK_POS = [11.6, 0, 0] as const;
/** AGV'nin palet bıraktığı rampa kenarı (missionLegs drop noktası). */
export const TRUCK_LOAD_POINT = { x: 10.2, z: 0.6 } as const;

/** Kasadaki palet yuvaları (kamyon lokali, z ekseni boyunca) */
const BED_SLOTS: [number, number, number][] = [
  [0, 0.74, 0.2],
  [0, 0.74, -1.0],
  [0, 0.74, -2.2],
];
const DEPART_SPEED = 4.2;
const GONE_Z = 42;

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.34, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.34, 0.34, 0.24, 20]} />
      <meshStandardMaterial color="#0d1013" roughness={0.85} />
    </mesh>
  );
}

/** Yükleme rampası + bekleyen sevkiyat kamyonu. Yüklenen paletler kasada
 * çizilir → kalkışta kamyonla birlikte giderler. Plan bitince finale:
 * kamyon tesisten ayrılır (Director "truckDock" kadrajı bunu filme çeker). */
export function Truck() {
  const rootRef = useRef<Group>(null!);
  const wheelsRef = useRef<Group>(null!);
  const loadedIds = useStore(truckStore, (s) => s.loadedIds);
  const completedPallets = useStore(simStore, (s) => s.completedPallets);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (!truckStore.getState().departing) return;
    const g = rootRef.current;
    if (g.position.z > GONE_Z) {
      g.visible = false;
      return;
    }
    g.position.z += DEPART_SPEED * dt;
    // Gerçek GLB takılıyken placeholder tekerlekler yoktur — ref null olabilir
    if (wheelsRef.current) {
      for (const w of wheelsRef.current.children) (w as Mesh).rotation.x += (DEPART_SPEED * dt) / 0.34;
    }
  });

  return (
    <group>
      {/* RAMPA / DOK: platform, tamponlar, ikaz şeritli sütunlar */}
      <group position={[10.55, 0, 0]}>
        <mesh position={[0, 0.09, 0]} receiveShadow>
          <boxGeometry args={[1.3, 0.18, 4.2]} />
          <meshStandardMaterial color="#2b323c" metalness={0.35} roughness={0.7} />
        </mesh>
        {([-1.9, 1.9] as const).map((z) => (
          <group key={z} position={[0.62, 0, z]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[0.14, 1.1, 0.14]} />
              <meshStandardMaterial color="#eab308" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.2, 0.24, 0.2]} />
              <meshStandardMaterial color="#111418" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* KAMYON */}
      <group ref={rootRef} position={[TRUCK_POS[0], 0, TRUCK_POS[2]]}>
        <OptionalModel name="truck">
          {/* Şasi */}
          <mesh position={[0, 0.52, -0.4]} castShadow>
            <boxGeometry args={[1.15, 0.16, 5.6]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.5} roughness={0.55} />
          </mesh>
          {/* Kasa tabanı (flatbed) + alçak korkuluklar */}
          <mesh position={[0, 0.66, -1.0]} castShadow>
            <boxGeometry args={[1.5, 0.12, 3.9]} />
            <meshStandardMaterial color="#37404c" metalness={0.55} roughness={0.5} />
          </mesh>
          {([-0.72, 0.72] as const).map((x) => (
            <mesh key={x} position={[x, 0.86, -1.0]}>
              <boxGeometry args={[0.05, 0.28, 3.9]} />
              <meshStandardMaterial color="#4a5563" metalness={0.6} roughness={0.45} />
            </mesh>
          ))}
          {/* Kabin */}
          <mesh position={[0, 0.95, 1.85]} castShadow>
            <boxGeometry args={[1.4, 1.1, 1.1]} />
            <meshStandardMaterial color="#b91c1c" metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.28, 2.1]}>
            <boxGeometry args={[1.2, 0.42, 0.06]} />
            <meshStandardMaterial color="#93c5fd" metalness={0.2} roughness={0.1} />
          </mesh>
          {/* Farlar + arka ikaz lambaları (bloom) */}
          {([-0.5, 0.5] as const).map((x) => (
            <mesh key={`h${x}`} position={[x, 0.62, 2.42]}>
              <boxGeometry args={[0.16, 0.1, 0.04]} />
              <meshStandardMaterial color="#fff7d6" emissive="#ffedb3" emissiveIntensity={2} toneMapped={false} />
            </mesh>
          ))}
          {([-0.55, 0.55] as const).map((x) => (
            <mesh key={`t${x}`} position={[x, 0.58, -3.02]}>
              <boxGeometry args={[0.1, 0.08, 0.04]} />
              <meshStandardMaterial color="#450a0a" emissive="#ef4444" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          ))}
          {/* Tekerlekler */}
          <group ref={wheelsRef}>
            {([1.7, -1.4, -2.4] as const).flatMap((z) =>
              ([-0.62, 0.62] as const).map((x) => <Wheel key={`${x},${z}`} x={x} z={z} />),
            )}
          </group>
        </OptionalModel>

        {/* Kasadaki yüklü paletler — kamyonla birlikte hareket eder */}
        {loadedIds.slice(0, BED_SLOTS.length).map((id, i) => {
          const cp = completedPallets.find((c) => c.id === id);
          if (!cp) return null;
          return (
            <group key={id} position={BED_SLOTS[i]} scale={0.9}>
              <PalletWithStack stack={cp.stack} banded />
            </group>
          );
        })}
      </group>
    </group>
  );
}
