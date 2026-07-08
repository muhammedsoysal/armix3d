import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import { PATROL_LOOP } from "./agvLogic";

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

/** Zemindeki AGV kılavuz hatları — kayan kesik çizgiler "veri akışı"
 * hissi verir, gerçek AGV tesislerindeki manyetik şerit görünümüdür. */
export function GuideLanes() {
  return (
    <group>
      {LOGISTICS_LANES.map((lane, i) => (
        <AnimatedLane key={i} points={lane} color="#38bdf8" speed={0.45} />
      ))}
      <AnimatedLane points={PATROL_LOOP} color="#eab308" speed={0.3} />
    </group>
  );
}
