import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import { useMemo } from "react";
import { CanvasTexture } from "three";
import { DOCK, PATROL_LOOP } from "./agvLogic";

const LANE_Y = 0.012; // Grid çizgilerinin (0.005) hemen üstü — z-fight yok

/** Lojistik şeritleri: dock → koridor → istasyon/grid hücreleri. */
const LOGISTICS_LANES: [number, number][][] = [
  // Ana koridor
  [
    [8.2, 3.2],
    [5.4, 2.2],
    [8.5, 2.2],
  ],
  // İstasyon sapağı
  [
    [5.4, 2.2],
    [5.4, 1.35],
  ],
  // Bitmiş Ürün Deposu sapakları
  [
    [8.4, 2.2],
    [8.4, -3.8],
  ],
  [
    [9.9, 2.2],
    [9.9, -3.8],
  ],
];

function AnimatedLane({
  points,
  color,
  speed,
}: {
  points: [number, number][];
  color: string;
  speed: number;
}) {
  const ref = useRef<Line2>(null);
  useFrame((_, dt) => {
    const mat = ref.current?.material;
    if (mat) mat.dashOffset -= speed * Math.min(dt, 0.05);
  });
  return (
    <Line
      ref={ref}
      points={points.map(([x, z]) => [x, LANE_Y, z] as [number, number, number])}
      color={color}
      lineWidth={1.6}
      dashed
      dashSize={0.28}
      gapSize={0.18}
      transparent
      opacity={0.55}
    />
  );
}

/** Şeridin altındaki 32cm'lik "boyalı bant" — çizgiler boşlukta süzülmesin. */
function LaneBand({ points }: { points: [number, number][] }) {
  return (
    <group>
      {points.slice(0, -1).map(([x0, z0], i) => {
        const [x1, z1] = points[i + 1];
        const len = Math.hypot(x1 - x0, z1 - z0);
        if (len < 0.01) return null;
        return (
          <group key={i} position={[(x0 + x1) / 2, 0.008, (z0 + z1) / 2]} rotation={[0, -Math.atan2(z1 - z0, x1 - x0), 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[len, 0.32]} />
              <meshStandardMaterial color="#0b1018" roughness={0.95} transparent opacity={0.9} />
            </mesh>
          </group>
        );
      })}
      {/* Kavşak dönüş noktaları */}
      {points.slice(1, -1).map(([x, z], i) => (
        <mesh key={`j${i}`} position={[x, 0.009, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 12]} />
          <meshStandardMaterial color="#c9a227" roughness={0.85} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function chargeTex(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ŞARJ", 128, 122);
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText("⚡", 128, 176);
  return new CanvasTexture(c);
}

/** Zemindeki AGV kılavuz hatları — boyalı bant + kayan kesik çizgi +
 * kavşak işaretleri + şarj istasyonu decal'i. */
export function GuideLanes() {
  const charge = useMemo(chargeTex, []);
  return (
    <group>
      {LOGISTICS_LANES.map((lane, i) => (
        <group key={i}>
          <LaneBand points={lane} />
          <AnimatedLane points={lane} color="#38bdf8" speed={0.45} />
        </group>
      ))}
      <LaneBand points={PATROL_LOOP} />
      <AnimatedLane points={PATROL_LOOP} color="#eab308" speed={0.3} />
      {/* Şarj istasyonu zemin işareti */}
      <mesh position={[DOCK.x, 0.0095, DOCK.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={charge} transparent depthWrite={false} opacity={0.85} />
      </mesh>
    </group>
  );
}
