import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, PlaneGeometry, type Group, type Mesh } from "three";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, easeInOut, simFrame } from "../sim/constants";
import { currentPartMeters, simStore } from "../sim/simStore";

const RAIL_Y = 2.55;
const PAD_TRAVEL_TOP = 2.1;
const PIECE_TOP_Y = LAYOUT.tableY + LAYOUT.sheetThickness;

/** Parça yüzeyi çözünürlüğü (springback deformasyonu için). */
const SEG_L = 24;
const SEG_W = 6;

interface LifterPose {
  carriageX: number;
  padY: number;
  pieceX: number;
  pieceY: number;
  sway: number;
  /** Parça vakumla tutuluyor mu (kısıt kalktı → rulo hafızası açığa çıkar)? */
  gripped: boolean;
  released: boolean;
}

/** LIFTING fazının alt-zaman çizelgesi: in → tut → taşı → bırak → çık. */
function lifterPose(progress: number, pickupX: number, dropY: number): LifterPose {
  const p = progress;
  const carryY = 1.85;
  if (p < 0.16) {
    const t = easeInOut(p / 0.16);
    return {
      carriageX: pickupX,
      padY: PAD_TRAVEL_TOP - t * (PAD_TRAVEL_TOP - PIECE_TOP_Y - 0.05),
      pieceX: pickupX,
      pieceY: PIECE_TOP_Y,
      sway: 0,
      gripped: false,
      released: false,
    };
  }
  if (p < 0.3) {
    const t = easeInOut((p - 0.16) / 0.14);
    const y = PIECE_TOP_Y + t * (carryY - PIECE_TOP_Y);
    return { carriageX: pickupX, padY: y + 0.05, pieceX: pickupX, pieceY: y, sway: t * 0.5, gripped: true, released: false };
  }
  if (p < 0.72) {
    const t = easeInOut((p - 0.3) / 0.42);
    const x = pickupX + t * (LAYOUT.palletX - pickupX);
    return { carriageX: x, padY: carryY + 0.05, pieceX: x, pieceY: carryY, sway: Math.sin(t * Math.PI), gripped: true, released: false };
  }
  if (p < 0.9) {
    const t = easeInOut((p - 0.72) / 0.18);
    const y = carryY - t * (carryY - dropY);
    return { carriageX: LAYOUT.palletX, padY: y + 0.05, pieceX: LAYOUT.palletX, pieceY: y, sway: (1 - t) * 0.4, gripped: true, released: false };
  }
  const t = easeInOut((p - 0.9) / 0.1);
  return {
    carriageX: LAYOUT.palletX,
    padY: dropY + 0.05 + t * (PAD_TRAVEL_TOP - dropY),
    pieceX: LAYOUT.palletX,
    pieceY: dropY,
    sway: 0,
    gripped: false,
    released: true,
  };
}

/**
 * Vakumlu kaldırıcı + springback'li parça: parça masadayken bastırılmış (düz)
 * durumdadır; vakum kaldırdığı anda kısıt kalkar ve rulo hafızası (coil set)
 * sönümlü yay dinamiğiyle geri yaylanır — kesim anındaki geometri ile taşıma
 * geometrisi arasındaki fark böylece süreklidir, "zıplama" olmaz.
 */
export function VacuumLifter() {
  const carriageRef = useRef<Group>(null!);
  const padRef = useRef<Group>(null!);
  const pieceRef = useRef<Mesh>(null!);

  const pieceGeometry = useMemo(() => {
    const geo = new PlaneGeometry(1, 1, SEG_L, SEG_W);
    geo.rotateX(-Math.PI / 2); // XZ düzlemine yatır: x=uzunluk, z=genişlik
    return geo;
  }, []);
  useEffect(() => () => pieceGeometry.dispose(), [pieceGeometry]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const sim = simStore.getState();
    const state = machineStateStore.getState().state;
    const part = currentPartMeters(sim);
    const pickupX = LAYOUT.cutX + part.length / 2;
    const stackTopY = LAYOUT.palletBaseY + sim.palletStack.length * 0.024 + 0.012;

    if (state === "LIFTING") {
      const pose = lifterPose(simFrame.progress, pickupX, stackTopY);
      carriageRef.current.position.x = pose.carriageX;
      padRef.current.position.y = pose.padY;

      // Springback: hedef bombe — tutulunca rulo seti açığa çıkar,
      // palete bastırılınca büyük ölçüde düzleşir (küçük kalıcı bombe kalır)
      const amp = simFrame.bowAmpAtCut;
      const target = pose.released ? amp * 0.18 : pose.gripped ? amp : 0;
      const k = 70; // yay sertliği
      const c = 7.5; // sönümleme
      simFrame.pieceBowVel += (k * (target - simFrame.pieceBow) - c * simFrame.pieceBowVel) * dt;
      simFrame.pieceBow += simFrame.pieceBowVel * dt;

      // Deformasyon: pad merkezden tutar, kenarlar bombe kadar sarkar
      const pos = pieceGeometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i) * 2; // -1..1 (uzunluk)
        // Sadece rulo açma yönünde (uzunlamasına) bükülme olmalı (v'yi kaldırdık)
        pos.setY(i, -simFrame.pieceBow * (u * u));
      }
      pos.needsUpdate = true;
      pieceGeometry.computeVertexNormals();

      pieceRef.current.visible = true;
      pieceRef.current.position.set(pose.pieceX, pose.pieceY - 0.006, 0);
      pieceRef.current.rotation.z = Math.sin(simFrame.progress * 26) * 0.018 * pose.sway;
      pieceRef.current.scale.set(part.length, 1, part.width);
    } else {
      pieceRef.current.visible = false;
      // bekleme pozisyonu: kesim alanı üstü
      carriageRef.current.position.x += (pickupX - carriageRef.current.position.x) * 0.04;
      padRef.current.position.y += (PAD_TRAVEL_TOP - padRef.current.position.y) * 0.06;
    }
  });

  return (
    <group>
      {/* Ray: kesim alanından palete */}
      <mesh position={[(LAYOUT.cutX + LAYOUT.palletX) / 2, RAIL_Y, 0]} castShadow>
        <boxGeometry args={[LAYOUT.palletX - LAYOUT.cutX + 2.2, 0.16, 0.3]} />
        <meshStandardMaterial color="#31404f" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Ray ayakları */}
      {[LAYOUT.cutX - 0.8, LAYOUT.palletX + 0.9].map((x) => (
        <mesh key={x} position={[x, RAIL_Y / 2, 0]} castShadow>
          <boxGeometry args={[0.18, RAIL_Y, 0.18]} />
          <meshStandardMaterial color="#2a333d" metalness={0.5} roughness={0.55} />
        </mesh>
      ))}

      {/* Araba + teleskopik kol + vakum padi */}
      <group ref={carriageRef} position={[LAYOUT.cutX + 0.3, 0, 0]}>
        <mesh position={[0, RAIL_Y - 0.18, 0]} castShadow>
          <boxGeometry args={[0.42, 0.2, 0.4]} />
          <meshStandardMaterial color="#e8a33d" metalness={0.55} roughness={0.4} />
        </mesh>
        <group ref={padRef} position={[0, PAD_TRAVEL_TOP, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.4, 12]} />
            <meshStandardMaterial color="#9aa2ab" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.06, 0.5]} />
            <meshStandardMaterial color="#e8a33d" metalness={0.55} roughness={0.4} />
          </mesh>
          {[[-0.25, -0.16], [-0.25, 0.16], [0.25, -0.16], [0.25, 0.16]].map(([x, z]) => (
            <mesh key={`${x},${z}`} position={[x, -0.05, z]}>
              <cylinderGeometry args={[0.055, 0.07, 0.05, 14]} />
              <meshStandardMaterial color="#22262c" roughness={0.85} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Taşınan parça — deforme edilebilir yüzey (springback) */}
      <mesh ref={pieceRef} geometry={pieceGeometry} visible={false} castShadow>
        <meshStandardMaterial color="#d3d8de" metalness={0.85} roughness={0.3} side={DoubleSide} />
      </mesh>
    </group>
  );
}
