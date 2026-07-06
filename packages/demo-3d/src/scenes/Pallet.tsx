import { useStore } from "zustand";
import { LAYOUT } from "../sim/constants";
import { simStore, type PalletPiece } from "../sim/simStore";
import { OptionalModel } from "../assets/AssetLoader";
import { agvStore } from "../agv/agvStore";
import { STAGING, dropSlotFor } from "../agv/agvLogic";

/** Ahşap palet + parça istifi — konumu çağıran belirler (grid, istasyon
 * veya AGV deck'i). AGV.tsx de taşınan paleti bununla çizer. */
export function PalletWithStack({ stack }: { stack: PalletPiece[] }) {
  return (
    <group>
      <OptionalModel name="pallet">
        {/* Palet tahtaları */}
        {[-0.45, -0.15, 0.15, 0.45].map((z) => (
          <mesh key={z} position={[0, 0.12, z]} castShadow>
            <boxGeometry args={[1.15, 0.035, 0.14]} />
            <meshStandardMaterial color="#8a6a45" roughness={0.85} />
          </mesh>
        ))}
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]} castShadow>
            <boxGeometry args={[0.12, 0.1, 1.05]} />
            <meshStandardMaterial color="#75593a" roughness={0.9} />
          </mesh>
        ))}
      </OptionalModel>

      {/* Kesilen parça istifi */}
      {stack.map((piece, i) => (
        <mesh
          key={i}
          position={[0, LAYOUT.palletBaseY + i * 0.024, 0]}
          rotation={[0, (i % 2 === 0 ? 1 : -1) * 0.02, 0]}
          castShadow
        >
          <boxGeometry args={[piece.length, 0.012, LAYOUT.sheetWidth]} />
          <meshStandardMaterial color="#c9ced5" metalness={0.85} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

/** Aktif palet + tamamlanan paletlerin yaşam döngüsü:
 * istasyonda AGV bekler → AGV deck'inde taşınır (burada çizilmez) →
 * grid hücresine teslim edilir. */
export function Pallet() {
  const stack = useStore(simStore, (s) => s.palletStack);
  const completedPallets = useStore(simStore, (s) => s.completedPallets);
  const carrying = useStore(agvStore, (s) => s.carrying);
  const pending = useStore(agvStore, (s) => s.pending);
  const deliveredIds = useStore(agvStore, (s) => s.deliveredIds);

  return (
    <group>
      {/* Aktif palet */}
      <group position={[LAYOUT.palletX, 0, 0]}>
        <PalletWithStack stack={stack} />
      </group>

      {completedPallets.map((cp, idx) => {
        // AGV deck'inde: AGV.tsx çizer
        if (carrying?.id === cp.id) return null;

        // Henüz teslim edilmedi: istasyonda AGV'yi bekliyor
        if (!deliveredIds.includes(cp.id)) {
          const queuePos = Math.max(0, pending.findIndex((p) => p.id === cp.id));
          return (
            <group key={cp.id} position={[STAGING.x + queuePos * 1.4, 0, STAGING.z]}>
              <PalletWithStack stack={cp.stack} />
            </group>
          );
        }

        // Teslim edildi: stok grid hücresi (append sıralı → indeks stabil)
        const slot = dropSlotFor(idx);
        return (
          <group key={cp.id} position={[slot.x, 0, slot.z]}>
            <PalletWithStack stack={cp.stack} />
          </group>
        );
      })}
    </group>
  );
}
