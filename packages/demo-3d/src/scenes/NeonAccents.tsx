import { AdditiveBlending } from "three";

/** "Apple-level" makine estetiği: her ana istasyonun altında yumuşak
 * neon taban ışıması + kesim portalında kenar neonları. Additive, ucuz,
 * bloom'la birleşince makineler "pahalı ve güçlü" okunur. */

function GlowPad({
  x,
  z,
  w,
  d,
  color = "#22d3ee",
  opacity = 0.16,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function EdgeNeon({
  pos,
  size,
  color = "#22d3ee",
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={pos} userData={{ noXray: true }}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function NeonAccents() {
  return (
    <group>
      {/* Taban ışımaları — istasyon başına imza rengi */}
      <GlowPad x={-8.2} z={0} w={3.4} d={3.2} color="#38bdf8" />           {/* rulo açıcı */}
      <GlowPad x={-5.2} z={0} w={2.2} d={2.4} color="#38bdf8" opacity={0.12} /> {/* doğrultucu */}
      <GlowPad x={0} z={0} w={3.4} d={3.4} color="#22d3ee" opacity={0.2} />     {/* kesim portalı */}
      <GlowPad x={5.4} z={0} w={2.4} d={2.4} color="#34d399" opacity={0.13} />  {/* paletleme */}
      <GlowPad x={4.6} z={-3.8} w={2.6} d={2.2} color="#22d3ee" opacity={0.15} /> {/* lazer */}
      <GlowPad x={1.4} z={-4.0} w={2.4} d={1.8} color="#f59e0b" opacity={0.12} /> {/* pres */}
      <GlowPad x={-5.4} z={3.5} w={7.0} d={2.6} color="#38bdf8" opacity={0.1} />  {/* yarma hattı */}

      {/* Kesim portalı kenar neonları — köprü boyunca iki şerit */}
      <EdgeNeon pos={[0, 2.0, 1.06]} size={[0.06, 0.03, 0.03]} />
      <EdgeNeon pos={[0, 2.0, -1.06]} size={[0.06, 0.03, 0.03]} />
      <EdgeNeon pos={[0, 1.99, 0]} size={[0.03, 0.03, 2.44]} />
      {/* Kolon ayak neonları */}
      <EdgeNeon pos={[0, 0.06, 1.08]} size={[0.4, 0.02, 0.36]} />
      <EdgeNeon pos={[0, 0.06, -1.08]} size={[0.4, 0.02, 0.36]} />
    </group>
  );
}
