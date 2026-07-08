import { AdditiveBlending, DoubleSide } from "three";

/** Highbay LED armatür sıraları — endüstriyel tavanın imzası.
 * Gerçek ışık YOK (FPS dostu): emissive disk + bloom halesi + hafif koni. */
function Highbay({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Askı çubuğu */}
      <mesh position={[0, 12.3, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
        <meshStandardMaterial color="#2a313b" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Gövde (çan) */}
      <mesh position={[0, 11.5, 0]}>
        <cylinderGeometry args={[0.42, 0.6, 0.35, 16]} />
        <meshStandardMaterial color="#3a424e" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Emissive lens — hologramda da yanık kalır */}
      <mesh position={[0, 11.31, 0]} rotation={[Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#f2f6ff" toneMapped={false} side={DoubleSide} />
      </mesh>
      {/* Hafif ışık konisi */}
      <mesh position={[0, 9.3, 0]} userData={{ noXray: true }}>
        <coneGeometry args={[1.5, 3.8, 14, 1, true]} />
        <meshBasicMaterial color="#dfe9ff" transparent opacity={0.045} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function CeilingLights() {
  const xs = [-25, -16.5, -8, 0.5, 9, 17.5, 26];
  const zs = [-16, -7, 2, 10];
  return (
    <group>
      {zs.flatMap((z) => xs.map((x) => <Highbay key={`${x},${z}`} x={x} z={z} />))}
    </group>
  );
}
