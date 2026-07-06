import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Mesh, type MeshStandardMaterial, type PointLight } from "three";
import { OptionalModel } from "../assets/AssetLoader";
import { telemetryStore } from "../telemetry/telemetryStore";

/** LSR-2 — Fiber Lazer Kesim Hücresi. Ana hattan BAĞIMSIZ kendi iş
 * döngüsünü sürer (9 sn kesim + 2.5 sn boşaltma) ve durumunu/parça
 * sayacını telemetri store'una yazar → dashboard canlı okur. */
const CUT_S = 9;
const UNLOAD_S = 2.5;
const CYCLE_S = CUT_S + UNLOAD_S;

export function LaserCell({ position = [3.0, 0, -3.0] as [number, number, number] }) {
  const headRef = useRef<Group>(null!);
  const beamRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLight>(null!);
  const lampRef = useRef<Mesh>(null!);
  const cycleRef = useRef({ t: 0, wasCutting: false });

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = cycleRef.current;
    c.t = (c.t + dt) % CYCLE_S;
    const cutting = c.t < CUT_S;

    // Kesim kafası: masa üzerinde Lissajous tarama (parça konturu hissi)
    if (cutting) {
      const u = c.t / CUT_S;
      headRef.current.position.x = 0.42 * Math.sin(u * Math.PI * 6);
      headRef.current.position.z = 0.3 * Math.sin(u * Math.PI * 4 + 1.2);
    }
    beamRef.current.visible = cutting;
    lightRef.current.visible = cutting;
    if (cutting) lightRef.current.intensity = 6 + Math.random() * 5;

    const lamp = lampRef.current.material as MeshStandardMaterial;
    lamp.emissive.set(cutting ? "#22d3ee" : "#f59e0b");
    lamp.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 8);

    // Faz geçişleri → telemetri (yalnız değişimde yaz, her kare değil)
    if (cutting !== c.wasCutting) {
      c.wasCutting = cutting;
      const tel = telemetryStore.getState();
      tel.updateMachine("LSR-2", { status: cutting ? "RUNNING" : "UNLOADING" });
      if (!cutting) {
        tel.updateMachine("LSR-2", { partsToday: tel.machines["LSR-2"].partsToday + 1 });
      }
    }
  });

  return (
    <group position={position}>
      <OptionalModel name="laser-cell">
        {/* Kesim masası */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.1, 1.1]} />
          <meshStandardMaterial color="#2b323c" metalness={0.6} roughness={0.5} />
        </mesh>
        {([-0.6, 0.6] as const).flatMap((x) =>
          ([-0.42, 0.42] as const).map((z) => (
            <mesh key={`${x},${z}`} position={[x, 0.19, z]}>
              <boxGeometry args={[0.08, 0.38, 0.08]} />
              <meshStandardMaterial color="#1c2128" metalness={0.5} roughness={0.6} />
            </mesh>
          )),
        )}
        {/* Portal çerçeve (kompakt hücre) */}
        {([-0.8, 0.8] as const).map((x) => (
          <mesh key={x} position={[x, 0.85, 0]} castShadow>
            <boxGeometry args={[0.12, 1.3, 0.9]} />
            <meshStandardMaterial color="#0e4d64" metalness={0.55} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[1.75, 0.18, 0.5]} />
          <meshStandardMaterial color="#0b3f52" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Kesim kafası + ışın */}
        <group ref={headRef} position={[0, 0, 0]}>
          <mesh position={[0, 1.22, 0]} castShadow>
            <boxGeometry args={[0.18, 0.3, 0.18]} />
            <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh ref={beamRef} position={[0, 0.78, 0]} visible={false}>
            <cylinderGeometry args={[0.008, 0.014, 0.62, 8]} />
            <meshBasicMaterial color="#67e8f9" toneMapped={false} transparent opacity={0.95} />
          </mesh>
        </group>
        <pointLight ref={lightRef} position={[0, 0.7, 0]} color="#22d3ee" distance={3} visible={false} />
        {/* Durum lambası */}
        <mesh ref={lampRef} position={[0.85, 1.62, 0]} userData={{ noXray: true }}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshStandardMaterial color="#083344" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* Makine etiketi */}
        <mesh position={[0, 1.05, 0.47]}>
          <boxGeometry args={[0.5, 0.16, 0.02]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      </OptionalModel>
    </group>
  );
}
