import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { QuadraticBezierLine } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import { useStore } from "zustand";
import { LAYOUT } from "../sim/constants";
import { xrayStore } from "./xrayStore";

/** Malzeme akışını gösteren yükselen veri kemerleri:
 * rulo → kesim → palet. Kayan kesik çizgi = akış yönü. */
function Arc({
  start,
  mid,
  end,
}: {
  start: [number, number, number];
  mid: [number, number, number];
  end: [number, number, number];
}) {
  const ref = useRef<Line2>(null);
  useFrame((_, dt) => {
    const mat = ref.current?.material;
    if (mat) mat.dashOffset -= 1.6 * Math.min(dt, 0.05);
  });
  return (
    <QuadraticBezierLine
      ref={ref}
      start={start}
      mid={mid}
      end={end}
      color="#67e8f9"
      lineWidth={2.4}
      dashed
      dashSize={0.22}
      gapSize={0.14}
      transparent
      opacity={0.9}
    />
  );
}

/** Yalnızca x-ray modunda görünür — aktif hattın "veri boru hattı". */
export function DataPipelines() {
  const active = useStore(xrayStore, (s) => s.active);
  if (!active) return null;
  return (
    <group>
      <Arc
        start={[LAYOUT.coilX, LAYOUT.coilAxleY, 0]}
        mid={[(LAYOUT.coilX + LAYOUT.cutX) / 2, 3.1, 0]}
        end={[LAYOUT.cutX, LAYOUT.tableY + 0.2, 0]}
      />
      <Arc
        start={[LAYOUT.cutX, LAYOUT.tableY + 0.2, 0]}
        mid={[(LAYOUT.cutX + LAYOUT.palletX) / 2, 2.7, 0]}
        end={[LAYOUT.palletX, 0.6, 0]}
      />
    </group>
  );
}
