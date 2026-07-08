import { useMemo } from "react";
import { CanvasTexture } from "three";

/** Endüstriyel "duvar yaşamı": HVAC kanalı, kablo tavası, EXIT tabelaları,
 * yangın noktaları, elektrik panoları, duvar vantilatörleri. ~30 ucuz mesh —
 * ziyaretçinin bilinçaltına "burası gerçek bir tesis" der. */

const STEEL = "#39424e";
const DUCT = "#5a646f";

function exitTex(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#052e16";
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ÇIKIŞ →", 128, 52);
  return new CanvasTexture(c);
}

function ExitSign({ pos, rotY }: { pos: [number, number, number]; rotY: number }) {
  const tex = useMemo(exitTex, []);
  return (
    <mesh position={pos} rotation={[0, rotY, 0]} userData={{ noXray: true }}>
      <planeGeometry args={[1.3, 0.5]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function FirePoint({ pos, rotY }: { pos: [number, number, number]; rotY: number }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.3, 0.05]}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0.12]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 10]} />
        <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Panel({ pos, rotY }: { pos: [number, number, number]; rotY: number }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[1.1, 1.6, 0.16]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      {[0.45, 0.25].map((y, i) => (
        <mesh key={i} position={[0.32, y, 0.17]} userData={{ noXray: true }}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshBasicMaterial color={i === 0 ? "#4ade80" : "#f59e0b"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function WallFan({ pos, rotY }: { pos: [number, number, number]; rotY: number }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.55, 0.55, 0.2, 20]} />
        <meshStandardMaterial color="#20262e" metalness={0.5} roughness={0.55} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0, 0.18]} rotation={[0, 0, (i * Math.PI) / 2 + 0.5]}>
          <boxGeometry args={[0.85, 0.14, 0.03]} />
          <meshStandardMaterial color="#39424e" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function WallDetails() {
  return (
    <group>
      {/* HVAC ana kanalı — arka duvar boyunca tavan altında */}
      <mesh position={[0, 10.8, -15.4]} rotation={[0, 0, Math.PI / 2]} castShadow={false}>
        <cylinderGeometry args={[0.5, 0.5, 38, 14]} />
        <meshStandardMaterial color={DUCT} metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Dikey inişler + dirsek küreleri */}
      {[-12, 0, 12].map((x) => (
        <group key={x}>
          <mesh position={[x, 10.8, -15.4]}>
            <sphereGeometry args={[0.55, 12, 10]} />
            <meshStandardMaterial color={DUCT} metalness={0.65} roughness={0.35} />
          </mesh>
          <mesh position={[x, 8.6, -15.4]}>
            <cylinderGeometry args={[0.42, 0.42, 4.4, 12]} />
            <meshStandardMaterial color={DUCT} metalness={0.65} roughness={0.35} />
          </mesh>
          <mesh position={[x, 6.3, -15.1]} rotation={[Math.PI / 2.6, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.55, 0.7, 12]} />
            <meshStandardMaterial color="#4a5560" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Kablo tavası — sol duvar boyunca */}
      <mesh position={[-21.7, 9.2, -3]} castShadow={false}>
        <boxGeometry args={[0.35, 0.12, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* EXIT tabelaları */}
      <ExitSign pos={[8, 5.6, 9.85]} rotY={Math.PI} />
      <ExitSign pos={[-21.75, 5.6, 4]} rotY={Math.PI / 2} />
      {/* Yangın noktaları */}
      <FirePoint pos={[-6, 1.1, -15.7]} rotY={0} />
      <FirePoint pos={[14, 1.1, -15.7]} rotY={0} />
      <FirePoint pos={[-21.7, 1.1, 1]} rotY={Math.PI / 2} />
      {/* Elektrik panoları */}
      <Panel pos={[4, 1.5, -15.75]} rotY={0} />
      <Panel pos={[-16, 1.5, -15.75]} rotY={0} />
      {/* Duvar vantilatörleri */}
      <WallFan pos={[-10, 7.5, -15.75]} rotY={0} />
      <WallFan pos={[18, 7.5, -15.75]} rotY={0} />
    </group>
  );
}
