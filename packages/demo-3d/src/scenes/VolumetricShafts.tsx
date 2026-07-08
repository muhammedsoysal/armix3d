import { useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, DoubleSide } from "three";
import { Sparkles } from "@react-three/drei";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";
import { xrayStore } from "../xray/xrayStore";

/** Tepeden düşen sahte volümetrik ışık hüzmesi dokusu: üstte parlak,
 * tabana doğru şeffaflaşan dikey gradyan (raymarch yok, kiosk dostu). */
function makeShaftTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.55, "rgba(210,225,255,0.18)");
  grad.addColorStop(1.0, "rgba(200,220,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 128);
  return new CanvasTexture(canvas);
}

// Çatı ışıklıklarının yerleri: hat üstü, rulo deposu üstü, palet sahası üstü
const SHAFTS: { x: number; z: number; topR: number; bottomR: number; h: number }[] = [
  { x: 0, z: 0, topR: 0.5, bottomR: 2.4, h: 12.6 },
  { x: -6, z: -2, topR: 0.6, bottomR: 2.8, h: 12.6 },
  { x: 4.2, z: 1, topR: 0.45, bottomR: 2.2, h: 12.6 },
  { x: -14, z: -8, topR: 0.6, bottomR: 3.0, h: 12.6 },
  { x: 12, z: -6, topR: 0.55, bottomR: 2.6, h: 12.6 },
  { x: -22, z: -14, topR: 0.6, bottomR: 3.0, h: 12.6 },
  { x: 20, z: 4, topR: 0.55, bottomR: 2.6, h: 12.6 },
  { x: -41, z: -8, topR: 0.6, bottomR: 3.0, h: 12.6 }, // plazma
  { x: 29, z: -12, topR: 0.6, bottomR: 2.8, h: 12.6 }, // kaynak
  { x: 33, z: 8, topR: 0.55, bottomR: 2.6, h: 12.6 }, // boru lazer
  { x: 2, z: -24, topR: 0.55, bottomR: 2.6, h: 12.6 }, // toz boya
];

export function VolumetricShafts() {
  const enabled = useStore(qualityStore, (s) => s.params.volumetrics);
  // Işık hüzmesi madde değildir: şematik (x-ray) dünyada var olmaz
  const xrayActive = useStore(xrayStore, (s) => s.active);
  const texture = useMemo(makeShaftTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);

  if (!enabled || xrayActive) return null;

  return (
    <group>
      {SHAFTS.map((s, i) => (
        <group key={i} position={[s.x, s.h / 2, s.z]}>
          <mesh>
            {/* Kesik koni: tepede dar ışıklık, zeminde geniş havuz; uçlar açık */}
            <cylinderGeometry args={[s.topR, s.bottomR, s.h, 24, 1, true]} />
            <meshBasicMaterial
              map={texture}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
              opacity={0.14}
            />
          </mesh>
          {/* Hüzme içinde asılı toz zerreleri */}
          <Sparkles
            count={40}
            scale={[s.bottomR * 1.4, s.h * 0.9, s.bottomR * 1.4]}
            size={1.6}
            speed={0.08}
            opacity={0.35}
            color="#dce8ff"
          />
        </group>
      ))}
    </group>
  );
}
