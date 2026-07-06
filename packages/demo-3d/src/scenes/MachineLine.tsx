import { Coil } from "./Coil";
import { Straightener } from "./Straightener";
import { Sheet } from "./Sheet";
import { CuttingGantry } from "./CuttingGantry";
import { Sparks } from "./Sparks";
import { Smoke } from "./Smoke";
import { VacuumLifter } from "./VacuumLifter";
import { Pallet } from "./Pallet";
import { LAYOUT } from "../sim/constants";

/** Besleme ve çıkış masaları. */
function Tables() {
  const infeedLen = LAYOUT.cutX - (LAYOUT.straightenerX + 0.65);
  const infeedX = LAYOUT.straightenerX + 0.65 + infeedLen / 2;
  return (
    <>
      <mesh position={[infeedX, LAYOUT.tableY - 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[infeedLen, 0.1, 1.5]} />
        <meshStandardMaterial color="#3a424c" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[LAYOUT.cutX + 0.7, LAYOUT.tableY - 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.4, 0.1, 1.5]} />
        <meshStandardMaterial color="#3a424c" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* Masa ayakları */}
      {[infeedX - infeedLen / 2 + 0.2, LAYOUT.cutX - 0.3, LAYOUT.cutX + 1.2].map((x) =>
        ([-0.6, 0.6] as const).map((z) => (
          <mesh key={`${x},${z}`} position={[x, (LAYOUT.tableY - 0.1) / 2, z]}>
            <boxGeometry args={[0.08, LAYOUT.tableY - 0.1, 0.08]} />
            <meshStandardMaterial color="#262c33" metalness={0.5} roughness={0.6} />
          </mesh>
        )),
      )}
    </>
  );
}

/** Bekleyen rulo stok alanı (Bobin Deposu). Fabrika hissiyatını artırır. */
function WaitingCoils() {
  const coilsData = [
    { z: -3.5, x: -4, radius: 0.85, width: 1.2, color: "#aab1ba", matProps: { metalness: 0.95, roughness: 0.15 } }, // 304 BA (Çok Parlak)
    { z: -3.5, x: -1.5, radius: 0.95, width: 1.5, color: "#8b949e", matProps: { metalness: 0.85, roughness: 0.4 } }, // 316L (Biraz mat)
    { z: -3.5, x: 1, radius: 0.75, width: 1.0, color: "#9ba4b5", matProps: { metalness: 0.9, roughness: 0.25 } },   // 430 2B
    { z: -5.5, x: -3, radius: 1.05, width: 1.2, color: "#7a828a", matProps: { metalness: 0.8, roughness: 0.5 } },   // Stok
    { z: -5.5, x: -0.5, radius: 0.8, width: 1.5, color: "#c6cbd1", matProps: { metalness: 0.98, roughness: 0.1 } }, // 304 BA
  ];

  return (
    <group>
      {coilsData.map((c, i) => (
        <group key={i} position={[c.x, c.radius + 0.1, c.z]}>
          {/* Rulo Gövdesi */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[c.radius, c.radius, c.width, 48]} />
            <meshStandardMaterial color={c.color} metalness={c.matProps.metalness} roughness={c.matProps.roughness} />
          </mesh>
          {/* Ortasındaki Boşluk / Mil Deliği */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, c.width + 0.02, 32]} />
            <meshStandardMaterial color="#1a1c20" metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Ahşap Altlıklar (Takozlar) */}
          {[-c.width / 2 + 0.15, c.width / 2 - 0.15].map((wOffset, j) => (
            <group key={j} position={[0, -c.radius + 0.05, wOffset]}>
              <mesh position={[-0.3, -0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
              </mesh>
              <mesh position={[0.3, -0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** CNC hattının tamamı: rulo → doğrultucu → kesim → vakum kaldırıcı → palet. */
export function MachineLine() {
  return (
    <group>
      <WaitingCoils />
      <Coil />
      <Straightener />
      <Tables />
      <Sheet />
      <CuttingGantry />
      <Sparks />
      <Smoke />
      <VacuumLifter />
      <Pallet />
    </group>
  );
}
