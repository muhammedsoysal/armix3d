import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { pathLength, pointAlongPath, type FloorPath } from "../agv/agvLogic";

/** Vardiya operatörü rotası: hat önünde tur atar, istasyonlarda durur. */
const ROUTE: FloorPath = [
  [2.2, 1.6],
  [-2.5, 1.6],
  [-4.6, 2.7],
  [-7.2, 2.6],
  [-4.6, 2.7],
  [-2.5, 1.6],
  [2.2, 1.6],
];
const WALK_SPEED = 0.55;
/** Rota üzerinde duraklama noktaları (mesafe, bekleme sn) */
const PAUSES: [number, number][] = [
  [3.2, 4], // kesim önü
  [9.5, 5], // yarma hattı önü
];

/** Düşük poligonlu ama okunaklı operatör: baret + hi-vis yelek + yürüyüş
 * animasyonu (bacak/kol salınımı + gövde zıplaması). */
export function Worker() {
  const rootRef = useRef<Group>(null!);
  const leftLegRef = useRef<Group>(null!);
  const rightLegRef = useRef<Group>(null!);
  const leftArmRef = useRef<Group>(null!);
  const rightArmRef = useRef<Group>(null!);
  const sRef = useRef(0);
  const yawRef = useRef(Math.PI);
  const pauseRef = useRef(0);
  const total = pathLength(ROUTE);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    let walking = true;

    if (pauseRef.current > 0) {
      pauseRef.current -= dt;
      walking = false;
    } else {
      const before = sRef.current;
      sRef.current = (sRef.current + WALK_SPEED * dt) % total;
      // Duraklama noktasından geçtiyse bekle
      for (const [at, wait] of PAUSES) {
        if (before < at && sRef.current >= at) pauseRef.current = wait;
      }
    }

    const p = pointAlongPath(ROUTE, sRef.current);
    rootRef.current.position.set(p.x, 0, p.z);
    if (walking) {
      const dYaw = ((p.heading - yawRef.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      yawRef.current += dYaw * Math.min(1, dt * 5);
    }
    rootRef.current.rotation.y = yawRef.current;

    // Yürüyüş döngüsü
    const t = clock.elapsedTime;
    const swing = walking ? Math.sin(t * 6) * 0.5 : 0;
    leftLegRef.current.rotation.x = swing;
    rightLegRef.current.rotation.x = -swing;
    leftArmRef.current.rotation.x = -swing * 0.7;
    rightArmRef.current.rotation.x = swing * 0.7;
    rootRef.current.position.y = walking ? Math.abs(Math.sin(t * 6)) * 0.025 : 0;
  });

  const limb = (ref: React.RefObject<Group>, x: number, y: number, len: number, color: string, r: number) => (
    <group ref={ref} position={[x, y, 0]}>
      <mesh position={[0, -len / 2, 0]} castShadow>
        <capsuleGeometry args={[r, len - r * 2, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );

  return (
    <group ref={rootRef} position={[ROUTE[0][0], 0, ROUTE[0][1]]}>
      {/* Bacaklar (lacivert iş pantolonu) */}
      {limb(leftLegRef, 0.09, 0.78, 0.76, "#1e3a5f", 0.07)}
      {limb(rightLegRef, -0.09, 0.78, 0.76, "#1e3a5f", 0.07)}
      {/* Gövde: hi-vis yelek */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.34, 4, 10]} />
        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
      {/* Reflektör şeritler */}
      {([1.0, 1.18] as const).map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.178, 0.178, 0.03, 12]} />
          <meshStandardMaterial color="#e5e7eb" emissive="#9ca3af" emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Kollar */}
      {limb(leftArmRef, 0.24, 1.3, 0.56, "#374151", 0.05)}
      {limb(rightArmRef, -0.24, 1.3, 0.56, "#374151", 0.05)}
      {/* Kafa + baret */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.11, 14, 10]} />
        <meshStandardMaterial color="#d4a373" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#facc15" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.585, 0.06]}>
        <boxGeometry args={[0.2, 0.02, 0.14]} />
        <meshStandardMaterial color="#facc15" roughness={0.45} />
      </mesh>
    </group>
  );
}
