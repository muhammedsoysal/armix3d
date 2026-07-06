import { useState } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import { useStore } from "zustand";
import { scrapStore } from "./scrapStore";

/** Kasa dolu sayılacağı kütle (kg) — görsel ölçek. */
const FULL_KG = 60;
const W = 1.1;
const D = 0.8;
const H = 0.55;
const WALL = 0.04;

/** Fiziksel hurda kasası: her kesimde biriken firenin kütlesi ve ₺ değeri.
 * "Fire'ın fiyat etiketi" — teknik alıcıya en net konuşan görsel. */
export function ScrapBin({ position = [0.9, 0, -1.6] as [number, number, number] }) {
  const scrapKg = useStore(scrapStore, (s) => s.scrapKg);
  const scrapValueTL = useStore(scrapStore, (s) => s.scrapValueTL);
  const cuts = useStore(scrapStore, (s) => s.cuts);
  const [hovered, setHovered] = useState(false);

  const fill = Math.min(scrapKg / FULL_KG, 1);
  const fillH = Math.max(0.015, fill * (H - 0.08));

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Taban + 4 duvar (emniyet sarısı şeritli sac kasa) */}
      <mesh position={[0, WALL / 2, 0]} receiveShadow>
        <boxGeometry args={[W, WALL, D]} />
        <meshStandardMaterial color="#3f4854" metalness={0.6} roughness={0.5} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <mesh key={`x${s}`} position={[(s * (W - WALL)) / 2, H / 2, 0]} castShadow>
          <boxGeometry args={[WALL, H, D]} />
          <meshStandardMaterial color="#4b5563" metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {([1, -1] as const).map((s) => (
        <mesh key={`z${s}`} position={[0, H / 2, (s * (D - WALL)) / 2]} castShadow>
          <boxGeometry args={[W, H, WALL]} />
          <meshStandardMaterial color="#4b5563" metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* Sarı ikaz şeridi */}
      <mesh position={[0, H - 0.05, (D - WALL + 0.002) / 2]}>
        <boxGeometry args={[W, 0.06, 0.004]} />
        <meshStandardMaterial color="#eab308" roughness={0.6} />
      </mesh>

      {/* Biriken fire: yükselen dolgu + üstte dağınık kırpıntılar */}
      <mesh position={[0, WALL + fillH / 2, 0]}>
        <boxGeometry args={[W - WALL * 2.5, fillH, D - WALL * 2.5]} />
        <meshStandardMaterial color="#8d959f" metalness={0.85} roughness={0.42} />
      </mesh>
      {fill > 0.02 &&
        [
          [-0.25, 0.12, 0.18],
          [0.2, -0.1, -0.55],
          [0.05, 0.22, 0.9],
        ].map(([x, z, rot], i) => (
          <mesh key={i} position={[x, WALL + fillH + 0.012, z]} rotation={[0, rot, 0.06]} castShadow>
            <boxGeometry args={[0.3, 0.01, 0.14]} />
            <meshStandardMaterial color="#aeb6bf" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}

      {/* Kasa etiketi */}
      <RoundedBox args={[0.36, 0.14, 0.01]} radius={0.015} position={[0, H * 0.55, (D + 0.01) / 2]}>
        <meshStandardMaterial color="#b91c1c" roughness={0.55} />
      </RoundedBox>

      {hovered && (
        <Html position={[0, H + 0.55, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div className="w-60 rounded-xl border border-red-400/40 bg-gradient-to-br from-slate-900/95 to-red-950/80 p-4 shadow-[0_0_25px_rgba(239,68,68,0.3)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold tracking-[0.2em] text-red-300">HURDA KASASI</span>
              <span className="text-[10px] text-slate-400">bu vardiya</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Kesim:</span>
                <span className="text-slate-200">{cuts} parça</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fire kütlesi:</span>
                <span className="font-semibold text-slate-100">{scrapKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Kayıp değer:</span>
                <span className="font-bold text-red-400">
                  ₺{scrapValueTL.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="mt-2 border-t border-white/10 pt-1.5 text-[9px] text-slate-500">
              304 hurda ₺85/kg üzerinden · Karar Motoru fire tahmini
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
