import { useMemo } from "react";
import { PalletWithStack } from "./Pallet";
import type { PalletPiece } from "../sim/simStore";
import { FG_WAREHOUSE, dropSlotFor } from "../agv/agvLogic";

/** Bitmiş Ürün Deposu dekoru: dinamik AGV hücrelerinin arkasını dolduran
 * düzinelerce hazır (bantlı) palet — tesis dolu ve üretken görünür.
 * Deterministik üretilir (idx tabanlı), her yenilemede aynı sahne. */
export function FinishedGoodsWarehouse() {
  const pallets = useMemo(() => {
    const out: { x: number; z: number; rot: number; stack: PalletPiece[] }[] = [];
    // 4 sütun × 3 sıra = 12 dekor palet (draw-call bütçesi: 24 palet FPS'i
    // 27'ye düşürüyordu; çember yalnız ön sırada — arka sıralar sade)
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        const idx = col * 6 + row;
        const h = 3 + ((idx * 7) % 9); // 3..11 parça — değişken istif yüksekliği
        const stack: PalletPiece[] = Array.from({ length: h }, (_, i) => ({
          sku: `FG-${idx}`,
          width: 0.9 + ((idx + i) % 3) * 0.1,
          length: 0.7 + (idx % 4) * 0.12,
        }));
        out.push({
          x: FG_WAREHOUSE.x0 + col * FG_WAREHOUSE.colStep,
          z: -5.6 - row * 1.55,
          rot: (((idx * 13) % 7) - 3) * 0.02, // hafif düzensizlik = gerçekçilik
          stack,
        });
      }
    }
    return out;
  }, []);

  return (
    <group>
      {/* Bölge zemini: koyu işaretli depo alanı */}
      <mesh position={[10.6, 0.008, -9.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.5, 10.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.95} />
      </mesh>
      {/* Dinamik AGV hücrelerinin park çizgileri */}
      {Array.from({ length: 6 }, (_, i) => dropSlotFor(i)).map((slot, i) => (
        <group key={`cell${i}`} position={[slot.x, 0.0092, slot.z]}>
          {([[0, 0.72, 1.5, 0.06], [0, -0.72, 1.5, 0.06], [0.72, 0, 0.06, 1.5], [-0.72, 0, 0.06, 1.5]] as const).map(([cx, cz, cw, cd], k) => (
            <mesh key={k} position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[cw, cd]} />
              <meshStandardMaterial color="#4a7a5a" roughness={0.9} transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {pallets.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <PalletWithStack stack={p.stack} banded={p.z > -6} />
        </group>
      ))}
    </group>
  );
}
