import { useStore } from "zustand";
import { LAYOUT } from "../sim/constants";
import { simStore } from "../sim/simStore";
import { OptionalModel } from "../assets/AssetLoader";

/** Ahşap palet + kesilen parçaların istifi (palet dolunca forklift alır). */
export function Pallet() {
  const stack = useStore(simStore, (s) => s.palletStack);

  return (
    <group position={[LAYOUT.palletX, 0, 0]}>
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
          <boxGeometry args={[piece.length, 0.012, piece.width]} />
          <meshStandardMaterial color="#c9ced5" metalness={0.85} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}
