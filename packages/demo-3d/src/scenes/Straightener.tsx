import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, PHASE_DURATION } from "../sim/constants";
import { currentPartMeters, simStore } from "../sim/simStore";
import { OptionalModel } from "../assets/AssetLoader";

const ROLLER_R = 0.13;
const ROLLER_LEN = 1.5;
const TOP_ROW: number[] = [-0.3, 0, 0.3];
const BOTTOM_ROW: number[] = [-0.45, -0.15, 0.15, 0.45];

function Roller({ x, y, dir }: { x: number; y: number; dir: 1 | -1 }) {
  const meshRef = useRef<Mesh>(null!);
  useFrame((_, dt) => {
    if (machineStateStore.getState().state !== "FEEDING") return;
    const part = currentPartMeters(simStore.getState());
    const feedSpeed = part.length / PHASE_DURATION.FEEDING;
    meshRef.current.rotation.y += dir * (feedSpeed / ROLLER_R) * dt;
  });
  return (
    <group position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[ROLLER_R, ROLLER_R, ROLLER_LEN, 28]} />
        <meshStandardMaterial color="#c3c9d1" metalness={0.95} roughness={0.22} />
        {/* Dönüşü görünür kılan yüzey çizgisi (silindir ekseni lokal Y) */}
        <mesh position={[ROLLER_R * 0.995, 0, 0]}>
          <boxGeometry args={[0.012, ROLLER_LEN * 0.96, 0.028]} />
          <meshStandardMaterial color="#59636f" metalness={0.8} roughness={0.35} />
        </mesh>
      </mesh>
    </group>
  );
}

/** Doğrultucu (straightener): açık şaseli merdane grubu — FEEDING sırasında döner. */
export function Straightener() {
  return (
    <group position={[LAYOUT.straightenerX, 0, 0]}>
      <OptionalModel name="straightener-frame">
        {/* Yan plakalar */}
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[0, 0.92, side * 0.82]} castShadow>
            <boxGeometry args={[1.25, 1.05, 0.08]} />
            <meshStandardMaterial color="#27548f" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
        {/* Gövde tabanı */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[1.25, 0.64, 1.72]} />
          <meshStandardMaterial color="#1f2f4a" metalness={0.5} roughness={0.55} />
        </mesh>
      </OptionalModel>

      {TOP_ROW.map((x) => (
        <Roller key={`t${x}`} x={x} y={1.06} dir={1} />
      ))}
      {BOTTOM_ROW.map((x) => (
        <Roller key={`b${x}`} x={x} y={0.72} dir={-1} />
      ))}
    </group>
  );
}
