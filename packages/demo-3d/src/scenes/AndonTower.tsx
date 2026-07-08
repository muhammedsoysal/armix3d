import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Mesh, type MeshStandardMaterial } from "three";
import { machineStateStore } from "@metalnest/core";
import { simStore } from "../sim/simStore";
import { LAYOUT } from "../sim/constants";
import { alarmStore } from "../alarm/alarmStore";

/** Andon kulesi — fabrikaların evrensel durum dili. Kesim portalının
 * yanında: yeşil=üretim, amber=beklemede, tümü yanıp sönen yeşil=plan bitti.
 * Materyaller her kare mutasyona uğrar → noXray. */
export function AndonTower() {
  const redRef = useRef<Mesh>(null!);
  const amberRef = useRef<Mesh>(null!);
  const greenRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const state = machineStateStore.getState().state;
    const done = simStore.getState().isPlanCompleted;
    const t = clock.elapsedTime;
    const blink = 0.5 + 0.5 * Math.sin(t * 6);

    const set = (m: Mesh, on: boolean, pulse = false) => {
      const mat = m.material as MeshStandardMaterial;
      mat.emissiveIntensity = on ? (pulse ? 1.2 + 2.4 * blink : 2.6) : 0.08;
    };
    // ALARM: kırmızı çakar, diğerleri söner · done: yeşil nabız · IDLE: amber
    const alarm = alarmStore.getState().active;
    set(redRef.current, alarm, true);
    set(greenRef.current, !alarm && (done || state !== "IDLE"), done);
    set(amberRef.current, !alarm && !done && state === "IDLE");
  });

  const seg = (y: number, color: string, emissive: string, ref: React.RefObject<Mesh>) => (
    <mesh ref={ref} position={[0, y, 0]} userData={{ noXray: true }}>
      <cylinderGeometry args={[0.055, 0.055, 0.09, 16]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.08} toneMapped={false} />
    </mesh>
  );

  return (
    <group position={[LAYOUT.cutX + 0.28, 0, 1.25]}>
      {/* Direk + taban */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
        <meshStandardMaterial color="#333a44" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.06, 12]} />
        <meshStandardMaterial color="#22272e" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* İstif lambaları: kırmızı / amber / yeşil */}
      {seg(1.98, "#450a0a", "#ef4444", redRef)}
      {seg(1.88, "#451a03", "#f59e0b", amberRef)}
      {seg(1.78, "#052e16", "#22c55e", greenRef)}
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#14181e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
