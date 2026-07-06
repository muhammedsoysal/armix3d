import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, simFrame } from "../sim/constants";
import { currentPart, simStore } from "../sim/simStore";
import { cuttingHeadZ } from "../scenes/CuttingGantry";
import { computeNest, type Nest } from "./nestingMath";

const KERF_MM = 5; // core HeuristicScrapEstimator ile aynı
const SHEET_W_MM = LAYOUT.sheetWidth * 1000;
const CW = 512;
const CH = 256;

/** Kırmızı çapraz tarama — fire bölgesi dolgusu. */
function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "rgba(239,68,68,0.10)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(239,68,68,0.55)";
  ctx.lineWidth = 1.5;
  for (let d = -h; d < w + h; d += 14) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(239,68,68,0.8)";
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

/** Nest yerleşimini canvas'a çizer. headZmm: kesim kafasının sac-eni
 * koordinatında anlık konumu (mm); geçtiği hücreler yeşile döner. */
export function paintNest(
  ctx: CanvasRenderingContext2D,
  nest: Nest,
  pieceLmm: number,
  headZmm: number | null,
) {
  const sx = CW / pieceLmm; // canvas-x ← boy (mm)
  const sy = CH / SHEET_W_MM; // canvas-y ← en (mm)
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = "rgba(3,12,24,0.50)";
  ctx.fillRect(0, 0, CW, CH);

  // Fire bölgeleri: en yönü artığı + boy yönü artığı
  if (nest.trimWmm > 0.5) hatch(ctx, 0, nest.usedWmm * sy, CW, nest.trimWmm * sy);
  const usedL = nest.rows > 0 ? nest.rows * (nest.cells[0]?.l ?? 0) + (nest.rows - 1) * KERF_MM : 0;
  if (pieceLmm - usedL > 0.5) hatch(ctx, usedL * sx, 0, (pieceLmm - usedL) * sx, nest.usedWmm * sy);

  // Parça hücreleri
  for (const c of nest.cells) {
    const x = c.x0 * sx;
    const y = c.z0 * sy;
    const w = c.l * sx;
    const h = c.w * sy;
    const cut = headZmm !== null && headZmm >= c.z0 + c.w; // kafa hücreyi geçti
    ctx.fillStyle = cut ? "rgba(34,197,94,0.32)" : "rgba(56,189,248,0.12)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = cut ? "#4ade80" : "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  // Kesim kafası izi: en boyunca parlak çizgi
  if (headZmm !== null && headZmm > 0 && headZmm < SHEET_W_MM) {
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, headZmm * sy);
    ctx.lineTo(CW, headZmm * sy);
    ctx.stroke();
  }
}

/** Karar Motoru'nun seçtiği yerleşimi kesilmekte olan sacın üzerine yansıtır:
 * cyan = planlanan parça, yeşil = kesilen, kırmızı tarama = fire. */
export function NestingProjection() {
  const meshRef = useRef<Mesh>(null!);
  const repaintAcc = useRef(0);
  const lastKey = useRef("");

  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d")!;
    const texture = new CanvasTexture(canvas);
    return { canvas, ctx, texture };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  void canvas;

  useFrame((_, dt) => {
    const state = machineStateStore.getState().state;
    const part = currentPart(simStore.getState());
    const mesh = meshRef.current;
    const mat = mesh.material as MeshBasicMaterial;
    const show = part && (state === "FEEDING" || state === "CUTTING");
    mesh.visible = !!show;
    if (!show || !part) return;

    const { width: pw, length: pl } = part.partDimensions;
    const pieceLmm = pl;
    const lenM = pieceLmm / 1000;
    mesh.scale.set(lenM, 1, 1);
    mesh.position.set(LAYOUT.cutX + lenM / 2, LAYOUT.tableY + LAYOUT.sheetThickness + 0.004, 0);

    // FEEDING: sac ilerledikçe belirir; CUTTING: tam görünür
    mat.opacity = state === "FEEDING" ? 0.15 + 0.75 * simFrame.progress : 0.95;

    // Kafa konumu → sac-eni mm (dünya z: -en/2..+en/2)
    const headZmm =
      state === "CUTTING"
        ? (cuttingHeadZ("CUTTING", simFrame.progress) + LAYOUT.sheetWidth / 2) * 1000
        : null;

    // Yeniden boyama: iş değişince hemen, kesim sırasında ≤10Hz
    repaintAcc.current += dt;
    const key = `${part.sku}:${state}`;
    if (key !== lastKey.current || (state === "CUTTING" && repaintAcc.current > 0.1)) {
      lastKey.current = key;
      repaintAcc.current = 0;
      const nest = computeNest(pw, pl, SHEET_W_MM, pieceLmm, KERF_MM);
      paintNest(ctx, nest, pieceLmm, headZmm);
      texture.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} userData={{ noXray: true }}>
      <planeGeometry args={[1, LAYOUT.sheetWidth]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}
