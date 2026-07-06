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

/** CNC hattının tamamı: rulo → doğrultucu → kesim → vakum kaldırıcı → palet. */
export function MachineLine() {
  return (
    <group>
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
