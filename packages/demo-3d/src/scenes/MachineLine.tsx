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

import { IndustrialCoilStorage } from "./IndustrialCoilStorage";
import { AGV, PatrolAGV } from "../agv/AGV";
import { INNER_LOOP } from "../agv/agvLogic";
import { GuideLanes } from "../agv/GuideLanes";
import { NestingProjection } from "../nesting/NestingProjection";
import { ScrapBin } from "../nesting/ScrapBin";
import { Forklift } from "./Forklift";
import { SlittingLine } from "./SlittingLine";
import { BandingStation } from "./BandingStation";
import { Truck } from "../truck/Truck";
import { AndonTower } from "./AndonTower";
import { QCScanner } from "./QCScanner";
import { Worker } from "./Worker";
import { LaserCell } from "./LaserCell";
import { Drums } from "./Drums";
import { FinishedGoodsWarehouse } from "./FinishedGoodsWarehouse";
import { PressBrake, Conveyors } from "./PressBrake";

/** CNC hattının tamamı: rulo → doğrultucu → kesim → vakum kaldırıcı → palet. */
export function MachineLine() {
  return (
    <group>
      <IndustrialCoilStorage />
      <Coil />
      <Straightener />
      <Tables />
      <Sheet />
      <NestingProjection />
      <ScrapBin />
      <CuttingGantry />
      <Sparks />
      <Smoke />
      <VacuumLifter />
      <Pallet />
      <AGV />
      <PatrolAGV />
      <PatrolAGV id="AGV-03" loop={INNER_LOOP} speed={0.75} bodyColor="#7c3aed" startS={12} />
      <GuideLanes />
      <Forklift />
      <SlittingLine />
      <BandingStation />
      <Truck />
      <AndonTower />
      <QCScanner />
      <Worker />
      <LaserCell />
      <Drums />
      <FinishedGoodsWarehouse />
      <PressBrake />
      <Conveyors />
    </group>
  );
}
