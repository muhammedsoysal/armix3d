import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, simFrame } from "../sim/constants";
import { currentPart, simStore } from "../sim/simStore";
import { packGuillotine, type PackResult } from "@metalnest/core";
import { cuttingHeadZ } from "../scenes/CuttingGantry";

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

/** Giyotin yerleşimini canvas'a çizer: dolu alan cyan, yerleşim dışı kalan
 * HER piksel kırmızı taramalı fire (giyotin boşlukları dahil — dürüst gösterim).
 * headZmm: kesim kafasının sac-eni koordinatında anlık konumu (mm). */
export function paintNest(
  ctx: CanvasRenderingContext2D,
  pack: PackResult,
  pieceLmm: number,
  headZmm: number | null,
) {
  const sx = CW / pieceLmm; // canvas-x ← boy (mm)
  const sy = CH / SHEET_W_MM; // canvas-y ← en (mm)
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = "rgba(3,12,24,0.50)";
  ctx.fillRect(0, 0, CW, CH);

  // Tüm zemin fire taraması — parçalar üstüne çizilince kalan = gerçek fire
  hatch(ctx, 0, 0, CW, CH);

  // Parça yerleşimleri (Placement: x=en, y=boy — canvas: x=boy, y=en)
  for (const p of pack.placements) {
    const x = p.y * sx;
    const y = p.x * sy;
    const w = p.l * sx;
    const h = p.w * sy;
    const cut = headZmm !== null && headZmm >= p.x + p.w; // kafa hücreyi geçti
    ctx.fillStyle = cut ? "rgba(34,197,94,0.85)" : "rgba(8,47,73,0.92)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = cut ? "rgba(34,197,94,0.25)" : "rgba(56,189,248,0.14)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = cut ? "#4ade80" : "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Döndürülmüş parçalara köşe işareti — karışık yönelim görünür olsun
    if (p.rotated) {
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + 12, y + 2);
      ctx.lineTo(x + 2, y + 12);
      ctx.fill();
    }
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
      const maxQty = Math.ceil(((SHEET_W_MM + KERF_MM) * (pieceLmm + KERF_MM)) / (pw * pl));
      const pack = packGuillotine([{ id: part.sku, w: pw, l: pl, qty: maxQty }], SHEET_W_MM, pieceLmm, KERF_MM);
      paintNest(ctx, pack, pieceLmm, headZmm);
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
