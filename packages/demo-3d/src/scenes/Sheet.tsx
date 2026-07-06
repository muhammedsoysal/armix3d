import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, PlaneGeometry, QuadraticBezierCurve3, Vector3, type Mesh } from "three";
import { machineStateStore } from "@metalnest/core";
import { COIL, LAYOUT, coilRadiusFor, simFrame } from "../sim/constants";
import { currentPartMeters, simStore } from "../sim/simStore";

const CURVE_SEGMENTS = 24;
const FLAT_START_X = LAYOUT.straightenerX - 0.15;

/** Kesim hattını geçen sacın anlık ucu (m, cutX'e göre). */
export function sheetLeadingEdge(): number {
  const state = machineStateStore.getState().state;
  const part = currentPartMeters(simStore.getState());
  if (state === "FEEDING") return part.length * simFrame.progress;
  if (state === "CUTTING") return part.length;
  return 0;
}

/**
 * Sac: iki bölüm — (a) rulodan doğrultucuya sarkarak inen kavisli bölüm
 * (her frame rulo yarıçapına göre yeniden şekillenir; sarkma v1'de bezier,
 * gerçek gerilim fiziği Adım 4'te), (b) masada ilerleyen düz bölüm.
 */
export function Sheet() {
  const curveRef = useRef<Mesh>(null!);
  const flatRef = useRef<Mesh>(null!);

  const curveGeometry = useMemo(
    () => new PlaneGeometry(1, 1, CURVE_SEGMENTS, 1),
    [],
  );

  useFrame(({ clock }) => {
    // (a) Kavisli bölüm: rulo tepesinden doğrultucu girişine
    const r = coilRadiusFor(simFrame.totalFedLength);
    const p0 = new Vector3(LAYOUT.coilX + 0.1, LAYOUT.coilAxleY + r - 0.01, 0);
    const p2 = new Vector3(LAYOUT.straightenerX - 0.6, LAYOUT.tableY + 0.06, 0);
    const feeding = machineStateStore.getState().state === "FEEDING";
    const sag = 0.24 + (feeding ? 0.045 * Math.sin(clock.elapsedTime * 6) * 0.5 + 0.02 : 0);
    const mid = new Vector3(
      (p0.x + p2.x) / 2,
      Math.min(p0.y, p2.y) + (Math.abs(p0.y - p2.y) * 0.5 - sag),
      0,
    );
    const curve = new QuadraticBezierCurve3(p0, mid, p2);

    const pos = curveGeometry.attributes.position;
    const halfW = LAYOUT.sheetWidth / 2;
    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      const pt = curve.getPoint(i / CURVE_SEGMENTS);
      pos.setXYZ(i, pt.x, pt.y, halfW); // üst sıra
      pos.setXYZ(i + CURVE_SEGMENTS + 1, pt.x, pt.y, -halfW); // alt sıra
    }
    pos.needsUpdate = true;
    curveGeometry.computeVertexNormals();

    // (b) Düz bölüm: doğrultucudan kesim ucuna
    const edge = LAYOUT.cutX + sheetLeadingEdge();
    const len = Math.max(edge - FLAT_START_X, 0.01);
    flatRef.current.scale.x = len;
    flatRef.current.position.x = FLAT_START_X + len / 2;
  });

  return (
    <>
      <mesh ref={curveRef} geometry={curveGeometry}>
        <meshStandardMaterial color="#cdd2d9" metalness={0.85} roughness={0.32} side={DoubleSide} />
      </mesh>
      <mesh ref={flatRef} position={[0, LAYOUT.tableY + LAYOUT.sheetThickness / 2, 0]} castShadow>
        <boxGeometry args={[1, LAYOUT.sheetThickness, LAYOUT.sheetWidth]} />
        <meshStandardMaterial color="#cdd2d9" metalness={0.85} roughness={0.32} />
      </mesh>
    </>
  );
}

/** Görsel sabit — rulonun tükenmediği durumda bile min. yarıçap dışına taşma olmasın diye. */
export const SHEET_MIN_COIL_R = COIL.RMIN;
