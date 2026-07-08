import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { type Group, type Mesh } from "three";
import { OptionalModel } from "../assets/AssetLoader";
import { pathLength, pointAlongPath, type FloorPath } from "../agv/agvLogic";
import { cellOf, traffic } from "../agv/trafficControl";

/** İkmal mekiği rotası: yarma hattı yanı ↔ rulo deposu (yeni depo bölgesi).
 * Duraklarda çatal iner/kalkar; depodan dönüşte çatalda RULO taşır. */
const ROUTE: FloorPath = [
  [-9.6, 2.6],   // yarma hattı yanı (bırakma)
  [-10.6, 0],
  [-10.6, -7.0], // rulo deposu (alma)
  [-10.6, 0],
  [-9.6, 2.6],
];
/** [rota mesafesi, bekleme sn, çatal hedefi 0|1, rulo al/bırak] */
const STOPS: [number, number, number, "pick" | "drop" | null][] = [
  [pathLength(ROUTE.slice(0, 3)), 3.5, 1, "pick"], // depoda: çatal kalkar, rulo biner
  [0.01, 3.5, 0, "drop"], // başlangıçta: çatal iner, rulo iner
];
const SPEED = 0.85;

const BODY = "#e8890c"; // emniyet turuncusu
const DARK = "#1c1f24";
const STEEL = "#6b7280";

/** Raf sahasının yanına park etmiş prosedürel forklift — sahneye "vardiya
 * arası" gerçekliği katar. `OptionalModel name="forklift"`: manifest'e
 * "forklift": "forklift.glb" eklenirse hazır model bunun yerine geçer. */
export function Forklift() {
  const rootRef = useRef<Group>(null!);
  const forksRef = useRef<Group>(null!);
  const coilRef = useRef<Mesh>(null!);
  const st = useRef({ s: 0.01, yaw: 0, pause: 0, lift: 0, carrying: false, lastS: 0.01 });
  const total = pathLength(ROUTE);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const f = st.current;
    if (f.pause > 0) {
      f.pause -= dt;
      // Duraklamada çatal hedefe süzülür
      const target = f.carrying ? 1 : 0;
      f.lift += (target - f.lift) * Math.min(1, dt * 3);
    } else {
      const nowP = pointAlongPath(ROUTE, f.s);
      const aheadP = pointAlongPath(ROUTE, Math.min(f.s + 1.0, total));
      if (traffic.request("FRK-1", [cellOf(nowP.x, nowP.z), cellOf(aheadP.x, aheadP.z)])) {
        const before = f.s;
        f.s = (f.s + SPEED * dt) % total;
        for (const [at, wait, , action] of STOPS) {
          const crossed = before < at && f.s >= at;
          const wrapped = f.s < before && (at <= f.s || at > before);
          if (crossed || wrapped) {
            f.pause = wait;
            if (action === "pick") f.carrying = true;
            if (action === "drop") f.carrying = false;
          }
        }
      }
    }
    const p = pointAlongPath(ROUTE, f.s);
    rootRef.current.position.set(p.x, 0, p.z);
    if (f.pause <= 0) {
      const dY = ((p.heading - Math.PI / 2 - f.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      f.yaw += dY * Math.min(1, dt * 4);
    }
    rootRef.current.rotation.y = f.yaw;
    forksRef.current.position.y = f.lift * 0.55;
    coilRef.current.visible = f.carrying && f.lift > 0.5;
  });

  return (
    <group ref={rootRef} position={[ROUTE[0][0], 0, ROUTE[0][1]]}>
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
        {/* Çatallar — kaldırma grubu + taşınan rulo */}
        <group ref={forksRef}>
        <mesh ref={coilRef} position={[1.42, 0.62, 0]} rotation={[0, 0, Math.PI / 2]} visible={false} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.55, 24]} />
          <meshStandardMaterial color="#aab1ba" metalness={0.9} roughness={0.3} />
        </mesh>
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
        </group>
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
