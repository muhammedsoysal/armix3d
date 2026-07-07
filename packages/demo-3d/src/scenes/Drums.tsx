import { OptionalModel } from "../assets/AssetLoader";

/** Saha dekoru: hidrolik yağ varilleri — gerçek GLB (Kenney CC0),
 * manifest yoksa basit silindir placeholder. */
function Drum({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <OptionalModel name="barrel">
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.7, 16]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.6} roughness={0.45} />
        </mesh>
      </OptionalModel>
    </group>
  );
}

export function Drums() {
  return (
    <group>
      {/* Lazer hücresi yanı */}
      <Drum position={[4.4, 0, -3.3]} />
      <Drum position={[4.75, 0, -2.95]} rotationY={0.8} />
      {/* Yarma hattı arkası */}
      <Drum position={[-9.2, 0, 4.3]} rotationY={2.1} />
      <Drum position={[-9.5, 0, 3.85]} />
    </group>
  );
}
