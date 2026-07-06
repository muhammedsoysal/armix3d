import { RoundedBox } from "@react-three/drei";
import { OptionalModel } from "../assets/AssetLoader";

const BODY = "#e8890c"; // emniyet turuncusu
const DARK = "#1c1f24";
const STEEL = "#6b7280";

/** Raf sahasının yanına park etmiş prosedürel forklift — sahneye "vardiya
 * arası" gerçekliği katar. `OptionalModel name="forklift"`: manifest'e
 * "forklift": "forklift.glb" eklenirse hazır model bunun yerine geçer. */
export function Forklift({
  position = [-8.6, 0, 2.4] as [number, number, number],
  rotationY = -0.9,
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <OptionalModel name="forklift">
        {/* Şasi + motor bölmesi */}
        <RoundedBox args={[1.5, 0.55, 0.95]} radius={0.06} smoothness={3} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.45} />
        </RoundedBox>
        {/* Karşı ağırlık (arka) */}
        <RoundedBox args={[0.5, 0.7, 0.9]} radius={0.08} smoothness={3} position={[-0.72, 0.5, 0]} castShadow>
          <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.5} />
        </RoundedBox>
        {/* Koltuk + direksiyon kolonu */}
        <mesh position={[-0.15, 0.95, 0]} castShadow>
          <boxGeometry args={[0.35, 0.35, 0.45]} />
          <meshStandardMaterial color={DARK} roughness={0.8} />
        </mesh>
        <mesh position={[0.25, 1.0, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
          <meshStandardMaterial color={DARK} roughness={0.6} />
        </mesh>
        {/* Üst koruma kafesi */}
        {([[0.45, 0.4], [0.45, -0.4], [-0.5, 0.4], [-0.5, -0.4]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 1.45, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.15, 8]} />
            <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[-0.02, 2.03, 0]} castShadow>
          <boxGeometry args={[1.15, 0.05, 0.95]} />
          <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Asansör direği (mast) — 2 ray + traversler */}
        {([0.28, -0.28] as const).map((z) => (
          <mesh key={z} position={[0.82, 1.1, z]} castShadow>
            <boxGeometry args={[0.09, 2.2, 0.09]} />
            <meshStandardMaterial color={STEEL} metalness={0.75} roughness={0.35} />
          </mesh>
        ))}
        {([0.45, 1.1, 1.75] as const).map((y) => (
          <mesh key={y} position={[0.82, y, 0]}>
            <boxGeometry args={[0.07, 0.08, 0.62]} />
            <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        {/* Çatallar */}
        {([0.22, -0.22] as const).map((z) => (
          <group key={z}>
            <mesh position={[0.92, 0.45, z]} castShadow>
              <boxGeometry args={[0.06, 0.5, 0.1]} />
              <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[1.42, 0.22, z]} castShadow>
              <boxGeometry args={[1.0, 0.045, 0.1]} />
              <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        ))}
        {/* Tekerlekler: ön büyük, arka küçük */}
        {([[0.5, 0.5, 0.22], [0.5, -0.5, 0.22], [-0.6, 0.48, 0.17], [-0.6, -0.48, 0.17]] as const).map(
          ([x, z, r], i) => (
            <mesh key={i} position={[x, r, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[r, r, 0.16, 20]} />
              <meshStandardMaterial color="#0f1215" roughness={0.85} />
            </mesh>
          ),
        )}
        {/* Arka ikaz feneri */}
        <mesh position={[-0.72, 0.92, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.08, 10]} />
          <meshStandardMaterial color="#331a00" emissive="#ff8c00" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </OptionalModel>
    </group>
  );
}
